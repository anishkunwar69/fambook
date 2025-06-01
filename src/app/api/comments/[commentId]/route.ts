import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment is too long"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    // 1. Validate and get commentId
    const { commentId } = await params;
    if (!commentId) {
      return NextResponse.json(
        { success: false, message: "Comment ID is required" },
        { status: 400 }
      );
    }

    // 2. Parse and validate body
    const body = await request.json();
    const validatedData = updateCommentSchema.safeParse(body);
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

    // 3. Auth check
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 4. Get user
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 5. Get comment and check ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user owns the comment
    if (comment.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access denied. You can only edit your own comments." },
        { status: 403 }
      );
    }

    // 6. Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: validatedData.data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error) {
    console.error("Failed to update comment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update comment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    // 1. Validate and get commentId
    const { commentId } = await params;
    if (!commentId) {
      return NextResponse.json(
        { success: false, message: "Comment ID is required" },
        { status: 400 }
      );
    }

    // 2. Auth check
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 3. Get user
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 4. Get comment and check ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user owns the comment
    if (comment.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access denied. You can only delete your own comments." },
        { status: 403 }
      );
    }

    // 5. Delete comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete comment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 