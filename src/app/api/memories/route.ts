import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for adding memories
const addMemorySchema = z
  .object({
    albumId: z.string().optional(),
    postId: z.string().optional(),
  })
  .refine((data) => data.albumId || data.postId, {
    message: "Either albumId or postId must be provided",
  });

export async function POST(req: NextRequest) {
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

    // Parse and validate request body
    const body = await req.json();
    const validatedData = addMemorySchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input data",
          errors: validatedData.error.errors,
        },
        { status: 400 }
      );
    }

    // Check if the album or post exists and belongs to user's family
    if (validatedData.data.albumId) {
      const album = await prisma.album.findUnique({
        where: { id: validatedData.data.albumId },
        include: {
          family: {
            include: {
              members: {
                where: { userId: dbUser.id, status: "APPROVED" },
              },
            },
          },
        },
      });

      if (!album) {
        return NextResponse.json(
          { success: false, message: "Album not found" },
          { status: 404 }
        );
      }

      if (album.family.members.length === 0) {
        return NextResponse.json(
          { success: false, message: "You don't have access to this album" },
          { status: 403 }
        );
      }
    }

    if (validatedData.data.postId) {
      const post = await prisma.post.findUnique({
        where: { id: validatedData.data.postId },
        include: {
          family: {
            include: {
              members: {
                where: { userId: dbUser.id, status: "APPROVED" },
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
          { success: false, message: "You don't have access to this post" },
          { status: 403 }
        );
      }
    }

    // Create the memory
    const memory = await prisma.memory.create({
      data: {
        userId: dbUser.id,
        albumId: validatedData.data.albumId,
        postId: validatedData.data.postId,
      },
      include: {
        album: {
          select: {
            id: true,
            name: true,
            coverImage: true,
          },
        },
        post: {
          select: {
            id: true,
            text: true,
            media: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Memory added successfully",
      data: memory,
    });
  } catch (error) {
    console.error("Failed to add memory:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add memory",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
