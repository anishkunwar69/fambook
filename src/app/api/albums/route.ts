import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createAlbumSchema = z.object({
  name: z
    .string()
    .min(2, "Album name must be at least 2 characters")
    .max(50, "Album name cannot exceed 50 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  familyIds: z
    .array(z.string().min(1, "Family ID cannot be empty"))
    .min(1, "At least one family must be selected"),
  eventId: z.string().optional(),
  mediaLimit: z.number().min(1).max(100).default(100),
});

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get user
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 3. Get all families where user is an approved member
    const userFamilies = await prisma.familyMember.findMany({
      where: {
        userId: user.id,
        status: "APPROVED",
      },
      select: {
        familyId: true,
      },
    });

    const familyIds = userFamilies.map((member) => member.familyId);

    // 4. Fetch albums from all families user is a member of
    const albums = await prisma.album.findMany({
      where: {
        familyId: {
          in: familyIds,
        },
      },
      include: {
        family: {
          select: {
            name: true,
            createdById: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
        media: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          select: {
            url: true,
          },
        },
        _count: {
          select: {
            media: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 5. Transform albums to include cover image, media count, and isAdmin status
    const transformedAlbums = albums.map((album) => ({
      id: album.id,
      name: album.name,
      description: album.description,
      coverImage: album.coverImage || album.media[0]?.url || null,
      familyId: album.familyId,
      mediaCount: album._count.media,
      createdAt: album.createdAt,
      family: {
        name: album.family.name,
      },
      event: album.event
        ? {
            title: album.event.title,
          }
        : undefined,
      isAdmin: album.family.createdById === user.id,
    }));

    return NextResponse.json({
      success: true,
      message: "Albums fetched successfully",
      data: transformedAlbums,
    });
  } catch (error) {
    console.error("Failed to fetch albums:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch albums",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await currentUser();
    if (!auth || !auth.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });
    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createAlbumSchema.safeParse(body);

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

    const { name, description, familyIds, eventId, mediaLimit } =
      validatedData.data;
    const createdAlbums = [];

    for (const familyId of familyIds) {
      const member = await prisma.familyMember.findFirst({
        where: { userId: dbUser.id, familyId: familyId, status: "APPROVED" },
      });

      if (!member) {
        // User is not an approved member of this family, skip or return error for this specific family
        console.warn(
          `User ${dbUser.id} not an approved member of family ${familyId}. Skipping album creation.`
        );
        // Optionally, collect errors/skipped families to report back
        continue;
      }

      const album = await prisma.album.create({
        data: {
          name,
          description,
          familyId,
          eventId,
          mediaLimit,
          createdById: dbUser.id,
        },
        include: { family: { select: { name: true } } }, // Include family name for notification
      });
      createdAlbums.push(album);

      // Create notifications for other family members
      const familyMembersToNotify = await prisma.familyMember.findMany({
        where: {
          familyId: familyId,
          status: "APPROVED",
          NOT: { userId: dbUser.id },
        },
      });

      if (dbUser.fullName && album.family?.name) {
        // Ensure names are available
        await Promise.all(
          familyMembersToNotify.map((fm) =>
            prisma.notification.create({
              data: {
                userId: fm.userId,
                type: "NEW_ALBUM",
                content: `${dbUser.fullName} created a new album "${album.name}" in ${album.family.name}`,
              },
            })
          )
        );
      }
    }

    if (createdAlbums.length === 0 && familyIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Could not create album in any selected families. User might not be an approved member.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${createdAlbums.length} album(s) created successfully`,
        data: createdAlbums,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create album(s):", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create album(s)",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
