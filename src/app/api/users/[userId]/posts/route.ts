import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Auth check
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current user from database
    const sessionUser = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const familyId = searchParams.get("familyId");

    const offset = (page - 1) * limit;

    // Build where clause - fetch posts BY the specified userId
    const whereClause: any = {
      userId: userId,
    };

    // Add family filter if provided
    if (familyId) {
      whereClause.familyId = familyId;
    }

    // Get current session user's family memberships to filter what posts they can see
    const userFamilies = await prisma.familyMember.findMany({
      where: {
        userId: sessionUser.id,
        status: "APPROVED",
      },
      select: {
        familyId: true,
      },
    });

    const familyIds = userFamilies.map((membership) => membership.familyId);

    // Add family visibility filter if not viewing own posts
    // Only show posts from families that the session user is also a member of
    if (sessionUser.id !== userId) {
      // If familyId is specified, check if user has access to that family
      if (familyId) {
        if (!familyIds.includes(familyId)) {
          // User doesn't have access to this family, return empty result
          return NextResponse.json({
            success: true,
            data: [],
          });
        }
      } else {
        // Show posts from all families the user has access to
        whereClause.familyId = {
          in: familyIds,
        };
      }
    }

    // Fetch posts with pagination
    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            imageUrl: true,
          },
        },
        family: {
          select: {
            id: true,
            name: true,
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            type: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: {
          where: {
            userId: sessionUser.id,
          },
          select: {
            id: true,
          },
        },
        memories: {
          where: {
            userId: sessionUser.id,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Transform posts to include isLiked and isInMemory flags
    const transformedPosts = posts.map((post) => ({
      ...post,
      media: post.media.map((media) => ({
        ...media,
        caption: null, // Add caption field for compatibility
      })),
      isLiked: post.likes.length > 0,
      isInMemory: post.memories.length > 0,
      likes: undefined, // Remove the likes array from response
      memories: undefined, // Remove the memories array from response
    }));

    return NextResponse.json({
      success: true,
      data: transformedPosts,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 