import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { MediaType } from "@prisma/client";

// GET: Fetch posts for a family
export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    // 1. Validate and get familyId
    const { familyId } = await params;
    if (!familyId) {
      return NextResponse.json(
        { success: false, message: "Family ID is required" },
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

    // 4. Check if user is a member of the family
    const member = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId,
        status: "APPROVED",
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // 5. Fetch posts with likes count and user's like status
    const posts = await prisma.post.findMany({
      where: {
        familyId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            imageUrl: true,
          },
        },
        media: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: {
          where: {
            userId: user.id,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 6. Transform posts to include isLiked
    const transformedPosts = posts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined, // Remove likes array from response
    }));

    return NextResponse.json({
      success: true,
      message: "Posts fetched successfully",
      data: transformedPosts,
    });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST: Create a new post
export async function POST(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    // 1. Validate familyId
    const { familyId } = await params;
    if (!familyId) {
      return NextResponse.json(
        { success: false, message: "Family ID is required" },
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
    const user = await prisma.user.findUnique({ where: { externalId: auth.id } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 4. Check family membership
    const member = await prisma.familyMember.findFirst({
      where: { userId: user.id, familyId, status: "APPROVED" },
    });
    if (!member) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // 5. Parse JSON body
    const body = await request.json();
    const { text, media } = body;

    // 6. Validate input
    if (!text && (!media || media.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Post must contain text or media" },
        { status: 400 }
      );
    }

    // 7. Create post with media in a transaction
    const post = await prisma.$transaction(async (tx) => {
      const newPost = await tx.post.create({
        data: {
          text,
          userId: user.id,
          familyId,
          media: {
            create: media.map(
              (m: { url: string; type: "PHOTO" | "VIDEO" }) => ({
                url: m.url,
                type: m.type,
              })
            ),
          },
        },
        include: {
          user: { select: { id: true, fullName: true, imageUrl: true } },
          media: true,
          _count: { select: { likes: true, comments: true } },
        },
      });

      // Create notifications for family members
      const familyMembers = await tx.familyMember.findMany({
        where: { familyId, status: "APPROVED", NOT: { userId: user.id } },
      });
      await Promise.all(
        familyMembers.map((member) =>
          tx.notification.create({
            data: {
              userId: member.userId,
              type: "NEW_POST",
              content: `${user.fullName} shared a new post in your family`,
            },
          })
        )
      );

      return newPost;
    });

    return NextResponse.json({
      success: true,
      message: "Post created successfully",
      data: { ...post, isLiked: false },
    });
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create post" },
      { status: 500 }
    );
  }
}
