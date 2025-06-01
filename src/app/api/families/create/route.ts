import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createFamilySchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    console.log("before auth");
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    console.log("after auth and before body");

    // 2. Parse and validate body
    const body = await request.json();
    const validatedData = createFamilySchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input",
          errors: validatedData.error.errors,
        },
        { status: 400 }
      );
    }

    console.log("after body and before upsert");

    // 3. Get or create user
    const user = await prisma.user.upsert({
      where: { externalId: auth.id },
      update: {},
      create: {
        externalId: auth.id,
        email: auth.emailAddresses[0].emailAddress,
        fullName: auth.fullName || `${auth.firstName} ${auth.lastName}`,
        imageUrl: auth.imageUrl,
      },
    });

    console.log("after upsert and before existing family");

    // 4. Check for duplicate family name for this user
    const existingFamily = await prisma.family.findFirst({
      where: {
        name: validatedData.data.name,
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    console.log("after existing family");

    if (existingFamily) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have a family with this name",
        },
        { status: 400 }
      );
    }

    console.log("after existing family and before transaction");

    // 5. Create family and notification in a transaction
    const { family } = await prisma.$transaction(async (tx) => {
      // Create the family with member
      const family = await tx.family.create({
        data: {
          name: validatedData.data.name,
          description:
            validatedData.data.description || "We are a happy family!",
          joinToken: crypto.randomBytes(6).toString("hex"),
          createdById: user.id,
          members: {
            create: {
              userId: user.id,
              role: "ADMIN",
              status: "APPROVED",
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  username: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "NEW_ALBUM",
          content: `You've successfully created the family "${family.name}"!`,
        },
      });

      console.log("after transaction");

      return { family };
    });

    auth.publicMetadata.admin = true;

    // 6. Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Family created successfully",
        data: {
          familyId: family.id,
          joinToken: family.joinToken,
          name: family.name,
          description: family.description,
          members: family.members,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create family",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
