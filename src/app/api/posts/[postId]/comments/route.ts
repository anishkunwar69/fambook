import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment is too long"),
});

const COMMENTS_PER_PAGE = 10;

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // 1. Validate and get postId
    const { postId } = await params;
    if (!postId) {
      return NextResponse.json(
        { success: false, message: "Post ID is required" },
        { status: 400 }
      );
    }

    // 2. Parse and validate body
    const body = await request.json();
    const validatedData = commentSchema.safeParse(body);
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

    // 5. Get post and check if user can access it
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        family: {
          include: {
            members: {
              where: {
                userId: user.id,
                status: "APPROVED",
              },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    if (post.family.members.length === 0) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // 6. Create comment and notification in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create comment
      const comment = await tx.comment.create({
        data: {
          content: validatedData.data.content,
          userId: user.id,
          postId,
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

      // Create notification if the comment is not by the post author
      if (post.userId !== user.id) {
        await tx.notification.create({
          data: {
            userId: post.userId,
            type: "NEW_COMMENT",
            content: `${user.fullName} commented on your post`,
          },
        });
      }

      return comment;
    });

    return NextResponse.json({
      success: true,
      message: "Comment added successfully",
      data: result,
    });
  } catch (error) {
    console.error("Failed to add comment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add comment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = await params;
    if (!postId) {
      return NextResponse.json(
        { success: false, message: "Post ID is required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(
      searchParams.get("limit") || COMMENTS_PER_PAGE.toString()
    );

    const offset = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc", // Show oldest comments first, good for reading context
      },
      skip: offset,
      take: limit,
    });

    const totalComments = await prisma.comment.count({ where: { postId } });
    const hasNextPage = offset + comments.length < totalComments;

    return NextResponse.json({
      success: true,
      data: {
        comments,
        nextPage: hasNextPage ? page + 1 : undefined,
        totalComments,
        currentPage: page,
      },
    });
  } catch (error) {
    console.error("[COMMENTS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error fetching comments" },
      { status: 500 }
    );
  }
}
