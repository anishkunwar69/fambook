import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import  prisma  from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { memoryId: string } }
) {
  try {
    // Authentication check
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current user from database
    const dbUser = await prisma.user.findUnique({
      where: { externalId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const { memoryId } = await params;
    // Check if memory exists and belongs to user
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
    });

    if (!memory) {
      return NextResponse.json(
        { success: false, message: "Memory not found" },
        { status: 404 }
      );
    }

    if (memory.userId !== dbUser.id) {
      return NextResponse.json(
        { success: false, message: "You don't have permission to delete this memory" },
        { status: 403 }
      );
    }

    // Delete the memory
    await prisma.memory.delete({
      where: { id: memoryId },
    });

    return NextResponse.json({
      success: true,
      message: "Memory deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete memory:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete memory",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 