import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    const auth = await currentUser();
    const { familyId } = await params;
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's ID
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get family with members and check if user is a member
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: {
        members: {
          where: {
            status: "APPROVED",
          },
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

    if (!family) {
      return NextResponse.json(
        { success: false, message: "Family not found" },
        { status: 404 }
      );
    }

    // Check if user is a member of this family
    const isMember = family.members.some(
      (member) => member.userId === user.id && member.status === "APPROVED"
    );

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Count pending requests
    const pendingRequestsCount = await prisma.familyMember.count({
      where: {
        familyId: family.id,
        status: "PENDING",
      },
    });

    // Return family data
    return NextResponse.json({
      success: true,
      message: "Family fetched successfully",
      data: {
        ...family,
        currentUserId: user.id,
        pendingRequestsCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch family:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch family" },
      { status: 500 }
    );
  }
}

const familyUpdateSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be 50 characters or less")
    .optional(),
  description: z
    .string()
    .max(200, "Description must be 200 characters or less")
    .optional()
    .nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found in database" },
        { status: 404 }
      );
    }
    const userId = user.id;
    const { familyId } = await params;

    if (!familyId) {
      return NextResponse.json(
        { success: false, message: "Family ID is required" },
        { status: 400 }
      );
    }

    const familyToUpdate = await prisma.family.findUnique({
      where: { id: familyId },
      select: { createdById: true },
    });

    if (!familyToUpdate) {
      return NextResponse.json(
        { success: false, message: "Family not found" },
        { status: 404 }
      );
    }

    if (familyToUpdate.createdById !== userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Not authorized to edit this family. Only the creator can edit it.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = familyUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, description } = validationResult.data;

    const updatedFamily = await prisma.family.update({
      where: { id: familyId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Family updated successfully",
        data: updatedFamily,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating family:", error);
    let errorMessage = "Failed to update family";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { familyId: string } }
) {
  try {
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found in database" },
        { status: 404 }
      );
    }
    const userId = user.id;

    const { familyId } = await params;

    if (!familyId) {
      return NextResponse.json(
        { success: false, message: "Family ID is required" },
        { status: 400 }
      );
    }

    // Fetch the family to check createdById
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      select: { createdById: true },
    });

    if (!family) {
      return NextResponse.json(
        { success: false, message: "Family not found" },
        { status: 404 }
      );
    }

    // Check if the current user is the creator of the family
    if (family.createdById !== userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Not authorized to delete this family. Only the creator can delete it.",
        },
        { status: 403 }
      );
    }

    // Proceed with deletion
    // Prisma will handle cascade deletes if they are defined in your schema
    await prisma.family.delete({
      where: { id: familyId },
    });

    // Use 204 No Content for successful DELETE with no body
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting family:", error);
    let errorMessage = "Failed to delete family";
    if (error instanceof Error) {
      // Check for specific Prisma errors if needed, e.g., record not found
      errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
