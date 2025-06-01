import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authentication check
    const user = await currentUser();
    const { userId } = await params;
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

    // Get target user profile
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "Target user not found" },
        { status: 404 }
      );
    }

    // Check if current user and target user share a family
    const sharedFamilies = await prisma.familyMember.findMany({
      where: {
        AND: [
          { userId: dbUser.id, status: "APPROVED" },
          {
            family: {
              members: {
                some: {
                  userId: targetUser.id,
                  status: "APPROVED",
                },
              },
            },
          },
        ],
      },
    });

    // Only allow access to memories if users are in the same family or viewing own memories
    const isSelf = dbUser.id === targetUser.id;
    const hasSharedFamily = sharedFamilies.length > 0;

    if (!isSelf && !hasSharedFamily) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have access to this user's memories",
        },
        { status: 403 }
      );
    }

    // Get pagination and filter parameters
    const memoryType = req.nextUrl.searchParams.get("type") || "all";
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build the query based on the type
    const whereClause: any = { userId: targetUser.id };

    if (memoryType === "albums") {
      whereClause.albumId = { not: null };
      whereClause.postId = null;
    } else if (memoryType === "posts") {
      whereClause.postId = { not: null };
      whereClause.albumId = null;
    }

    // Fetch memories with related content and pagination
    const memories = await prisma.memory.findMany({
      where: whereClause,
      include: {
        album:
          memoryType === "all" || memoryType === "albums"
            ? {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  coverImage: true,
                  createdAt: true,
                  mediaCount: true,
                  media: {
                    take: 4,
                    select: {
                      id: true,
                      url: true,
                      type: true,
                    },
                  },
                },
              }
            : false,
        post:
          memoryType === "all" || memoryType === "posts"
            ? {
                select: {
                  id: true,
                  text: true,
                  createdAt: true,
                  media: {
                    select: {
                      id: true,
                      url: true,
                      type: true,
                    },
                  },
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
                  _count: {
                    select: {
                      likes: true,
                      comments: true,
                    },
                  },
                  likes: {
                    where: {
                      userId: dbUser.id,
                    },
                    select: {
                      id: true,
                    },
                  },
                  memories: {
                    where: {
                      userId: dbUser.id,
                    },
                    select: {
                      id: true,
                    },
                  },
                },
              }
            : false,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: skip,
      take: limit,
    });

    // Transform memories to include proper post data structure if it's a post memory
    const transformedMemories = memories.map((memory) => {
      if (memory.post && "likes" in memory.post && "memories" in memory.post) {
        return {
          ...memory,
          post: {
            ...memory.post,
            isLiked: (memory.post as any).likes.length > 0,
            isInMemory: (memory.post as any).memories.length > 0,
            likes: undefined, // Remove the likes array from response for cleaner data
            memories: undefined, // Remove the memories array from response for cleaner data
          },
        };
      }
      return memory;
    });

    return NextResponse.json({
      success: true,
      data: transformedMemories,
      isSelf, // Include this flag to help UI determine edit permissions
      pagination: {
        page,
        limit,
        hasMore: memories.length === limit,
      },
    });
  } catch (error) {
    console.error("Failed to fetch memories:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch memories",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
