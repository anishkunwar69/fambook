import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateMediaSchema = z.object({
  caption: z.string().min(1).max(500),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { albumId: string; mediaId: string } }
) {
  try {
    // 1. Validate and get IDs
    const { albumId, mediaId } = params;
    if (!albumId || !mediaId) {
      return NextResponse.json(
        { success: false, message: "Album ID and Media ID are required" },
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

    // 4. Validate request body
    const body = await request.json();
    const validatedData = updateMediaSchema.safeParse(body);
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

    // 5. Check if media exists and user has access
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        album: {
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
        },
      },
    });

    if (!media || !media.album || media.album.id !== albumId) {
      return NextResponse.json(
        { success: false, message: "Media not found" },
        { status: 404 }
      );
    }

    if (media.album.family.members.length === 0) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // 6. Update media caption
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        caption: validatedData.data.caption,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Media caption updated successfully",
      data: updatedMedia,
    });
  } catch (error) {
    console.error("Failed to update media:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update media",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { albumId: string; mediaId: string } }
) {
  try {
    // 1. Validate and get IDs
    const { albumId, mediaId } = params;
    if (!albumId || !mediaId) {
      return NextResponse.json(
        { success: false, message: "Album ID and Media ID are required" },
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

    // 4. Check if media exists and user has access
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        album: {
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
        },
      },
    });

    if (!media || !media.album || media.album.id !== albumId) {
      return NextResponse.json(
        { success: false, message: "Media not found" },
        { status: 404 }
      );
    }

    if (media.album.family.members.length === 0) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // 5. Delete media
    await prisma.media.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete media:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete media",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 