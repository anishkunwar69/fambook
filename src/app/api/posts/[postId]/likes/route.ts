import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const LIKERS_PER_PAGE = 20;

// GET: Fetch users who liked a post, with pagination
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
    const limit = parseInt(searchParams.get("limit") || LIKERS_PER_PAGE.toString());
    const offset = (page - 1) * limit;

    const likes = await prisma.like.findMany({
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
        createdAt: "desc", // Show most recent likers first
      },
      skip: offset,
      take: limit,
    });

    const totalLikes = await prisma.like.count({ where: { postId } });
    const likers = likes.map(like => like.user);
    const hasNextPage = offset + likers.length < totalLikes;

    return NextResponse.json({
      success: true,
      data: {
        likers,
        nextPage: hasNextPage ? page + 1 : undefined,
        totalLikes,
        currentPage: page,
      },
    });
  } catch (error) {
    console.error("[POST_LIKES_GET]", error);
    return NextResponse.json(
      { success: false, message: "Error fetching likes" },
      { status: 500 }
    );
  }
}

// POST: Like or unlike a post
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  // ... existing code ...
} 