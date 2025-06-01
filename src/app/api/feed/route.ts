import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { MediaType, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";
    const sortOrder = searchParams.get("sortOrder") || "newest";
    const selectedFamilyId = searchParams.get("families") || "";

    // Get user's approved family memberships
    const userFamilies = await prisma.familyMember.findMany({
      where: {
        userId: user.id,
        status: "APPROVED",
      },
      select: {
        familyId: true,
      },
    });

    const userFamilyIds = userFamilies.map((member) => member.familyId);

    // Build where clause
    let whereClause: Prisma.PostWhereInput = {
      familyId: {
        in: userFamilyIds,
      },
    };

    // Add family filter if selected
    if (selectedFamilyId) {
      whereClause = {
        ...whereClause,
        familyId: selectedFamilyId,
      };
    }

    // Add search filter if provided
    if (search) {
      whereClause = {
        ...whereClause,
        user: {
          fullName: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      };
    }

    // Add media type filter if specified
    if (filter !== "all") {
      whereClause = {
        ...whereClause,
        media: {
          some: {
            type: filter === "photos" ? MediaType.PHOTO : MediaType.VIDEO,
          },
        },
      };
    }

    // Fetch posts with filters and pagination
    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        media: true,
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
            userId: user.id,
          },
          select: {
            id: true,
          },
        },
        memories: {
          where: {
            userId: user.id,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: sortOrder === "newest" ? "desc" : "asc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform posts to include isLiked and isInMemory
    const transformedPosts = posts.map((post) => ({
      id: post.id,
      text: post.text,
      media: post.media,
      user: post.user,
      family: post.family,
      createdAt: post.createdAt,
      _count: post._count,
      isLiked: post.likes.length > 0,
      isInMemory: post.memories.length > 0,
    }));

    return NextResponse.json({
      success: true,
      data: transformedPosts,
    });
  } catch (error) {
    console.error("[FEED_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error fetching feed" },
      { status: 500 }
    );
  }
}
