import { uploadToCloudinary } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { albumId: string } }
) {
  try {
    // 1. Validate and get albumId
    const { albumId } = params;
    if (!albumId) {
      return NextResponse.json(
        { success: false, message: "Album ID is required" },
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

    // 4. Get album and check if user can access it
    const album = await prisma.album.findUnique({
      where: { id: albumId },
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
        _count: {
          select: {
            media: true,
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
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // 5. Check media limit
    const formData = await request.formData();
    const mediaFiles = formData.getAll("media") as File[];

    if (album._count.media + mediaFiles.length > album.mediaLimit) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot add more files. Album limit is ${album.mediaLimit} items.`,
        },
        { status: 400 }
      );
    }

    // 6. Upload media files and create records in a transaction
    try {
      // Upload files to Cloudinary
      const mediaUrls = await Promise.all(
        mediaFiles.map((file) => uploadToCloudinary(file))
      );

      // Create media records in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create media records
        const media = await Promise.all(
          mediaUrls.map((media) =>
            tx.media.create({
              data: {
                url: media.url,
                type: media.type,
                albumId,
              },
            })
          )
        );

        // Create notifications for family members
        const familyMembers = await tx.familyMember.findMany({
          where: {
            familyId: album.family.id,
            status: "APPROVED",
            NOT: {
              userId: user.id,
            },
          },
        });

        await Promise.all(
          familyMembers.map((member) =>
            tx.notification.create({
              data: {
                userId: member.userId,
                type: "NEW_ALBUM",
                content: `${user.fullName} added ${mediaFiles.length} new items to "${album.name}"`,
              },
            })
          )
        );

        return media;
      });

      return NextResponse.json(
        {
          success: true,
          message: "Media uploaded successfully",
          data: result,
        },
        { status: 201 }
      );
    } catch (uploadError) {
      console.error("Failed to upload media:", uploadError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to upload media",
          error:
            uploadError instanceof Error
              ? uploadError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }
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
