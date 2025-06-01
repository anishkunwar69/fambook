import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const editAlbumSchema = z.object({
  name: z
    .string()
    .min(2, "Album name must be at least 2 characters")
    .max(50, "Album name cannot exceed 50 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  try {
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { externalId: authUser.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const { albumId } = await params;
    if (!albumId) {
      return NextResponse.json(
        { success: false, message: "Album ID is required" },
        { status: 400 }
      );
    }

    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        family: true, // To check membership and get family name
        media: {
          orderBy: {
            createdAt: "asc", // Or 'desc' based on desired order
          },
        },
        _count: {
          select: { media: true },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { success: false, message: "Album not found" },
        { status: 404 }
      );
    }

    // Authorization: Check if the user is a member of the album's family
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        familyId: album.familyId,
        userId: dbUser.id,
        status: "APPROVED", // Ensure the user is an approved member
      },
    });

    if (!familyMember) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You do not have access to this album.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: album,
    });
  } catch (error) {
    console.error("Failed to fetch album:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch album",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  try {
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { externalId: authUser.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const { albumId } = await params;
    if (!albumId) {
      return NextResponse.json(
        { success: false, message: "Album ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = editAlbumSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input",
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, description } = validation.data;

    if (!name && typeof description === "undefined") {
      return NextResponse.json(
        {
          success: false,
          message: "At least name or description must be provided to update.",
        },
        { status: 400 }
      );
    }

    // Check if album exists and if user is admin of the family
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: { family: true },
    });

    if (!album) {
      return NextResponse.json(
        { success: false, message: "Album not found" },
        { status: 404 }
      );
    }

    if (album.family.createdById !== dbUser.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not an admin of this family.",
        },
        { status: 403 }
      );
    }

    const updateData: { name?: string; description?: string | null } = {};
    if (name) updateData.name = name;
    if (typeof description !== "undefined")
      updateData.description = description;

    const updatedAlbum = await prisma.album.update({
      where: { id: albumId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Album updated successfully",
      data: updatedAlbum,
    });
  } catch (error) {
    console.error("Failed to update album:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update album",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  try {
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { externalId: authUser.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const { albumId } = await params;
    if (!albumId) {
      return NextResponse.json(
        { success: false, message: "Album ID is required" },
        { status: 400 }
      );
    }

    // Check if album exists and if user is admin of the family
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: { family: true, media: true }, // Include media to delete them as well
    });

    if (!album) {
      return NextResponse.json(
        { success: false, message: "Album not found" },
        { status: 404 }
      );
    }

    if (album.family.createdById !== dbUser.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not an admin of this family.",
        },
        { status: 403 }
      );
    }

    // In a transaction: delete media associated with the album, then delete the album itself
    await prisma.$transaction(async (tx) => {
      // Delete all media items in the album
      // Note: Cloudinary/storage deletion would happen here if media URLs are to be invalidated
      await tx.media.deleteMany({
        where: { albumId: albumId },
      });

      // Delete the album
      await tx.album.delete({
        where: { id: albumId },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Album and associated media deleted successfully",
      },
      { status: 200 }
    ); // 200 or 204
  } catch (error) {
    console.error("Failed to delete album:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete album",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
