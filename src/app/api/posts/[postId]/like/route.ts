import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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

    // 4. Get post and check if user can access it
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

    // 5. Toggle like in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if user has already liked the post
      const existingLike = await tx.like.findFirst({
        where: {
          postId,
          userId: user.id,
        },
      });

      if (existingLike) {
        // Unlike
        await tx.like.delete({
          where: { id: existingLike.id },
        });
        return { action: "unliked" };
      } else {
        // Like and create notification
        const [like] = await Promise.all([
          tx.like.create({
            data: {
              postId,
              userId: user.id,
            },
          }),
          // Only create notification if the post is not by the current user
          post.userId !== user.id
            ? tx.notification.create({
                data: {
                  userId: post.userId,
                  type: "NEW_LIKE",
                  content: `${user.fullName} liked your post`,
                },
              })
            : null,
        ]);
        return { action: "liked", like };
      }
    });

    return NextResponse.json({
      success: true,
      message: `Post ${result.action} successfully`,
      data: { isLiked: result.action === "liked" },
    });
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to toggle like",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
