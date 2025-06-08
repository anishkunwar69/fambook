import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { rootId: string } }
) {
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

    const { rootId } = await params;
    if (!rootId) {
      return NextResponse.json(
        { success: false, message: "Root ID is required" },
        { status: 400 }
      );
    }

    const root = await prisma.familyRoot.findUnique({
      where: { id: rootId },
      include: {
        family: true,
      },
    });

    if (!root) {
      return NextResponse.json(
        { success: false, message: "Family Root not found" },
        { status: 404 }
      );
    }

    // Check if the user is the admin (creator) of the family
    if (root.family.createdById !== dbUser.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Only the family admin can delete the family tree.",
        },
        { status: 403 }
      );
    }

    // Perform deletion
    await prisma.familyRoot.delete({
      where: { id: rootId },
    });

    return NextResponse.json(
      { success: true, message: "Family Root deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete family root:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while deleting the family root.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
