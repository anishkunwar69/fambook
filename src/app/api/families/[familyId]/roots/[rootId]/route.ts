import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Add validation schema
const rootNodeSchema = z.object({
  id: z.string(),
  rootId: z.string({
    required_error: "rootId is required",
    invalid_type_error: "rootId must be a string",
  }),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().transform((str) => new Date(str)), // Transform string to Date
  dateOfDeath: z
    .string()
    .nullable()
    .transform((str) => (str ? new Date(str) : null)),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  isAlive: z.boolean(),
  birthPlace: z.string().min(1, "Birth place is required"),
  currentPlace: z.string().min(1, "Current place is required"),
  profileImage: z.string().nullable(),
  biography: z.string().nullable(),
  customFields: z.record(z.any()).nullable(),
  userId: z.string().nullable().optional(), // Make userId optional and nullable
  linkedMemberId: z.string().nullable().optional(), // Make linkedMemberId optional and nullable
  positionX: z.number().nullable().optional(),
  positionY: z.number().nullable().optional(),
});

// Add relationship schema
const relationshipSchema = z.object({
  id: z.string(),
  fromNodeId: z.string(),
  toNodeId: z.string(),
  relationType: z.enum(["PARENT", "SPOUSE"]).refine((val) => {
    // Add debugging to see what values are being received
    console.log("[DEBUG] Received relationType:", val);
    return ["PARENT", "SPOUSE"].includes(val);
  }, {
    message: "Invalid relationship type. Only PARENT and SPOUSE are allowed."
  }),
  marriageDate: z.string().nullable(),
  divorceDate: z.string().nullable(),
  isActive: z.boolean(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string; rootId: string } }
) {
  try {
    // Auth check
    const auth = await currentUser();
    const { familyId, rootId } = await params;
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log("hello world");

    // Check if user is a member of the family
    const member = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId,
        status: "APPROVED",
      },
    });

    console.log("after member");

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Check if the user is an admin
    const isAdmin = member.role === "ADMIN";

    console.log("before root");

    // Fetch the root with all its data
    const root = await prisma.familyRoot.findUnique({
      where: {
        id: rootId,
        familyId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            imageUrl: true,
          },
        },
        nodes: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            dateOfDeath: true,
            gender: true,
            isAlive: true,
            profileImage: true,
            birthPlace: true,
            currentPlace: true,
            biography: true,
            customFields: true,
            linkedMemberId: true,
            positionX: true,
            positionY: true,
          },
        },
        relations: {
          select: {
            id: true,
            fromNodeId: true,
            toNodeId: true,
            relationType: true,
            marriageDate: true,
            divorceDate: true,
            isActive: true,
          },
        },
      },
    });

    console.log("after root");

    if (!root) {
      return NextResponse.json(
        { success: false, message: "Family root not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...root,
        isAdmin, // Add isAdmin flag to response
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { familyId: string; rootId: string } }
) {
  try {
    // Auth check
    const auth = await currentUser();
    const { familyId, rootId } = await params;
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is an admin
    const member = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId,
        status: "APPROVED",
        role: "ADMIN",
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Only admins can update family roots" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("Received body:", body); // Add logging

    // Validate nodes if present
    console.log("before body.nodes");
    if (body.nodes) {
      try {
        body.nodes.forEach((node: any) => {
          console.log("[DEBUG] Raw node data:", node); // Add logging
          // Ensure rootId is set from params if not present
          if (!node.rootId) {
            node.rootId = rootId;
          }
          const validatedNode = rootNodeSchema.parse(node);
          console.log("[DEBUG] Validated node data:", validatedNode); // Add logging
          node.dateOfBirth = validatedNode.dateOfBirth;
          node.dateOfDeath = validatedNode.dateOfDeath;
        });
      } catch (error) {
        console.error("Node validation failed:", error);
        return NextResponse.json(
          {
            success: false,
            message: "Invalid node data",
            error:
              error instanceof z.ZodError ? error.errors : "Validation failed",
          },
          { status: 400 }
        );
      }
    }
    console.log("after body.nodes");

    try {
      // Update nodes in a separate transaction
      if (body.nodes) {
        console.log("Processing nodes...");
        await prisma.$transaction(
          async (tx: any) => {
            const batchSize = 5;
            for (let i = 0; i < body.nodes.length; i += batchSize) {
              const batch = body.nodes.slice(i, i + batchSize);
              await Promise.all(
                batch.map((node: any) => {
                  console.log("[DEBUG] Processing node for upsert:", node); // Add logging
                  return tx.rootNode.upsert({
                    where: { id: node.id },
                    create: {
                      id: node.id,
                      rootId,
                      firstName: node.firstName,
                      lastName: node.lastName,
                      dateOfBirth: node.dateOfBirth
                        ? new Date(node.dateOfBirth)
                        : new Date(),
                      dateOfDeath: node.dateOfDeath
                        ? new Date(node.dateOfDeath)
                        : null,
                      gender: node.gender,
                      isAlive: node.isAlive,
                      profileImage: node.profileImage,
                      birthPlace: node.birthPlace,
                      currentPlace: node.currentPlace,
                      biography: node.biography,
                      customFields: node.customFields,
                      linkedMemberId: node.linkedMemberId,
                      positionX: node.positionX,
                      positionY: node.positionY,
                    },
                    update: {
                      firstName: node.firstName,
                      lastName: node.lastName,
                      dateOfBirth: node.dateOfBirth
                        ? new Date(node.dateOfBirth)
                        : new Date(),
                      dateOfDeath: node.dateOfDeath
                        ? new Date(node.dateOfDeath)
                        : null,
                      gender: node.gender,
                      isAlive: node.isAlive,
                      profileImage: node.profileImage,
                      birthPlace: node.birthPlace,
                      currentPlace: node.currentPlace,
                      biography: node.biography,
                      customFields: node.customFields,
                      linkedMemberId: node.linkedMemberId,
                      positionX: node.positionX,
                      positionY: node.positionY,
                    },
                  });
                })
              );
            }
          },
          {
            timeout: 5000,
          }
        );
      }

      // Update relationships in a separate transaction
      if (body.relations) {
        console.log("Processing relations...");
        await prisma.$transaction(
          async (tx: any) => {
            // Delete relations that are no longer present
            const existingRelations = await tx.rootRelation.findMany({
              where: { rootId },
              select: { id: true },
            });

            const newRelationIds = body.relations.map((r: any) => r.id);
            const relationsToDelete = existingRelations
              .map((r: any) => r.id)
              .filter((id: any) => !newRelationIds.includes(id));

            if (relationsToDelete.length > 0) {
              await tx.rootRelation.deleteMany({
                where: {
                  id: {
                    in: relationsToDelete,
                  },
                  rootId,
                },
              });
            }

            // Process relations in smaller batches
            const batchSize = 5;
            for (let i = 0; i < body.relations.length; i += batchSize) {
              const batch = body.relations.slice(i, i + batchSize);
              await Promise.all(
                batch.map(async (relation: any) => {
                  // Add comprehensive debugging
                  console.log("[DEBUG] Processing relation:", {
                    id: relation.id,
                    fromNodeId: relation.fromNodeId,
                    toNodeId: relation.toNodeId,
                    originalRelationType: relation.relationType,
                    marriageDate: relation.marriageDate,
                    divorceDate: relation.divorceDate,
                    isActive: relation.isActive
                  });

                  const relationType = relation.relationType || "PARENT";
                  
                  // Log if there was a fallback to default
                  if (!relation.relationType) {
                    console.warn("[DEBUG] RelationType was falsy, defaulting to PARENT for relation:", relation.id);
                  }
                  
                  // Validate that we only accept PARENT or SPOUSE
                  if (!["PARENT", "SPOUSE"].includes(relationType)) {
                    console.error("[DEBUG] Invalid relationType detected:", relationType, "for relation:", relation.id);
                    throw new Error(`Invalid relationship type: ${relationType}. Only PARENT and SPOUSE are allowed.`);
                  }

                  console.log("[DEBUG] Final relationType to save:", relationType);

                  if (!relation.fromNodeId || !relation.toNodeId) {
                    console.error(
                      "Missing fromNodeId or toNodeId for relation:",
                      relation
                    );
                    throw new Error(
                      "Missing fromNodeId or toNodeId for relation"
                    );
                  }

                  return tx.rootRelation.upsert({
                    where: {
                      id: relation.id,
                    },
                    create: {
                      id: relation.id,
                      rootId,
                      fromNodeId: relation.fromNodeId,
                      toNodeId: relation.toNodeId,
                      relationType: relationType,
                      marriageDate: relation.marriageDate
                        ? new Date(relation.marriageDate)
                        : null,
                      divorceDate: relation.divorceDate
                        ? new Date(relation.divorceDate)
                        : null,
                      isActive: relation.isActive ?? true,
                    },
                    update: {
                      fromNodeId: relation.fromNodeId,
                      toNodeId: relation.toNodeId,
                      relationType: relationType,
                      marriageDate: relation.marriageDate
                        ? new Date(relation.marriageDate)
                        : null,
                      divorceDate: relation.divorceDate
                        ? new Date(relation.divorceDate)
                        : null,
                      isActive: relation.isActive ?? true,
                    },
                  });
                })
              );
            }
          },
          {
            timeout: 5000,
          }
        );
      }

      // Fetch final result separately (not in a transaction)
      const result = await prisma.familyRoot.findUnique({
        where: { id: rootId },
        include: {
          nodes: true,
          relations: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error updating root:", error);
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.log(
      error instanceof Error ? error.message : "An unknown error occurred"
    );
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
