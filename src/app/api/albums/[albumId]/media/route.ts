import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  try {
    const { albumId } = await params;
    if (!albumId) {
      return NextResponse.json(
        { success: false, message: "Album ID is required" },
        { status: 400 }
      );
    }

    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        family: {
          include: {
            members: { where: { userId: user.id, status: "APPROVED" } },
          },
        },
        _count: { select: { media: true } },
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
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { media: mediaItems } = body;

    if (!mediaItems || !Array.isArray(mediaItems) || mediaItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "No media items provided" },
        { status: 400 }
      );
    }

    if (album._count.media + mediaItems.length > album.mediaLimit) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot add more files. Album limit is ${album.mediaLimit} items.`,
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdMedia = await Promise.all(
        mediaItems.map((media) =>
          tx.media.create({
            data: {
              url: media.url,
              type: media.type,
              albumId,
            },
          })
        )
      );

      const familyMembers = await tx.familyMember.findMany({
        where: {
          familyId: album.family.id,
          status: "APPROVED",
          NOT: { userId: user.id },
        },
      });
      await Promise.all(
        familyMembers.map((member) =>
          tx.notification.create({
            data: {
              userId: member.userId,
              type: "NEW_ALBUM",
              content: `${user.fullName} added ${mediaItems.length} new items to "${album.name}"`,
            },
          })
        )
      );
      return createdMedia;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Media uploaded successfully",
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to handle media upload:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to handle media upload",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
