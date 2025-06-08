import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for validating POST request body for creating a FamilyRoot
const createFamilyRootSchema = z.object({
  name: z
    .string()
    .min(3, "Root name must be at least 3 characters")
    .max(100, "Root name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  familyId: z.string().min(1, "Family ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { externalId: authUser.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found in database" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = createFamilyRootSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, description, familyId } = validation.data;
    console.log(familyId, name, description);

    // Verify user is a member of the selected family
    const familyMember = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: {
          userId: dbUser.id,
          familyId: familyId,
        },
      },
    });

    if (!familyMember) {
      return NextResponse.json(
        { success: false, message: "You are not a member of this family." },
        { status: 403 }
      );
    }

    // Check for existing FamilyRoot with the same name in the same family
    const existingRoot = await prisma.familyRoot.findFirst({
      where: {
        familyId: familyId,
      },
    });

    if (existingRoot) {
      return NextResponse.json(
        {
          success: false,
          message: `A family tree named "${name}" already exists in this family.`,
        },
        { status: 409 } // 409 Conflict is appropriate here
      );
    }

    const newFamilyRoot = await prisma.familyRoot.create({
      data: {
        name,
        description,
        familyId,
        createdById: dbUser.id, // Link to the internal User ID
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Family Root created successfully",
        data: newFamilyRoot,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create family root:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create family root",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET handler (copied and adapted from another route, e.g., events)
export async function GET(request: NextRequest) {
  try {
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { externalId: authUser.id },
    });
    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Fetch roots from families the user is a member of
    const userFamilies = await prisma.familyMember.findMany({
      where: { userId: dbUser.id, status: "APPROVED" }, // Assuming 'APPROVED' status for active members
      select: { familyId: true },
    });

    const familyIds = userFamilies.map((fm) => fm.familyId);

    if (familyIds.length === 0) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 }); // No families, so no roots from their families
    }

    const roots = await prisma.familyRoot.findMany({
      where: {
        OR: [
          { familyId: { in: familyIds } }, // Roots belonging to user's families
          { createdById: dbUser.id }, // Roots created by the user (even if not in their family directly)
        ],
      },
      include: {
        family: {
          select: { id: true, name: true, familyPhoto: true },
        },
        createdBy: {
          select: { fullName: true, imageUrl: true },
        },
        _count: {
          select: { nodes: true, relations: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const rootsWithAdminStatus = roots.map((root) => ({
      ...root,
      isAdmin: root.createdById === dbUser.id,
    }));

    return NextResponse.json(
      {
        success: true,
        data: rootsWithAdminStatus,
        currentInternalUserId: dbUser.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch roots:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch roots",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
