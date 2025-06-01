import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { subDays, subHours } from "date-fns";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { familyId: string } }
) {
  try {
    // Auth check
    const auth = await currentUser();
    const { familyId } = await params;
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

    // Check if user is a member of the family
    const member = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId: familyId,
        status: "APPROVED",
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Get time ranges for statistics
    const now = new Date();
    const last24Hours = subHours(now, 24);
    const lastWeek = subDays(now, 7);
    const lastMonth = subDays(now, 30);

    // Get all statistics in parallel for better performance
    const [memberStats, contentStats] = await Promise.all([
      // Member statistics
      prisma.$transaction([
        prisma.familyMember.count({
          where: {
            familyId: familyId,
            status: "APPROVED",
          },
        }),
        prisma.familyMember.count({
          where: {
            familyId: familyId,
            status: "PENDING",
          },
        }),
      ]),

      // Content statistics
      prisma.$transaction([
        // Recent posts (24h)
        prisma.post.count({
          where: {
            familyId,
            createdAt: { gte: last24Hours },
          },
        }),
        // Weekly posts
        prisma.post.count({
          where: {
            familyId,
            createdAt: { gte: lastWeek },
          },
        }),
        // Monthly posts
        prisma.post.count({
          where: {
            familyId,
            createdAt: { gte: lastMonth },
          },
        }),
        // Total albums with media count
        prisma.album.findMany({
          where: { familyId },
          include: {
            _count: {
              select: { media: true },
            },
          },
        }),
        // Upcoming events
        prisma.specialDay.count({
          where: {
            familyId: familyId,
            date: { gte: now },
          },
        }),
      ]),
    ]);

    const [approvedMembers, pendingMembers] = memberStats;
    const [recentPosts, weeklyPosts, monthlyPosts, albums, upcomingEvents] =
      contentStats;

    // Calculate total media across all albums
    const totalMedia = albums.reduce(
      (sum, album) => sum + album._count.media,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        members: {
          total: approvedMembers + pendingMembers,
          approved: approvedMembers,
          pending: pendingMembers,
        },
        content: {
          posts: {
            last24Hours: recentPosts,
            lastWeek: weeklyPosts,
            lastMonth: monthlyPosts,
          },
          albums: {
            total: albums.length,
            totalMedia,
          },
          events: {
            upcoming: upcomingEvents,
          },
        },
      },
    });
  } catch (error) {
    console.error("[FAMILY_STATS_GET]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch family statistics",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
