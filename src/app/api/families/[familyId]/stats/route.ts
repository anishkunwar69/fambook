import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { startOfMonth, subDays, subHours } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    const auth = await currentUser();
    const { familyId } = await params;

    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's ID
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if the user is a member of the family
    const userMembership = await prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: user.id,
        status: "APPROVED",
      },
    });

    if (!userMembership) {
      return NextResponse.json(
        { success: false, message: "You are not a member of this family" },
        { status: 403 }
      );
    }

    // Get the family
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: {
        members: {
          where: { status: "APPROVED" },
          select: { id: true },
        },
      },
    });

    if (!family) {
      return NextResponse.json(
        { success: false, message: "Family not found" },
        { status: 404 }
      );
    }

    // Get the number of members in the family
    const memberCount = family.members.length;

    // Get the current month's start date
    const currentMonthStart = startOfMonth(new Date());

    // Get the number of posts made in the current month
    const currentMonthPosts = await prisma.post.count({
      where: {
        familyId,
        createdAt: {
          gte: currentMonthStart,
        },
      },
    });

    // Get the number of albums created in the current month
    const currentMonthAlbums = await prisma.album.count({
      where: {
        familyId,
        createdAt: {
          gte: currentMonthStart,
        },
      },
    });

    // Get the number of events (special days) created in the current month
    const currentMonthEvents = await prisma.specialDay.count({
      where: {
        familyId,
        createdAt: {
          gte: currentMonthStart,
        },
      },
    });

    console.log(`Family ${familyId} has ${currentMonthPosts} posts in the current month`);
    console.log(`Family ${familyId} has ${currentMonthAlbums} albums in the current month`);
    console.log(`Family ${familyId} has ${currentMonthEvents} events in the current month`);
    console.log(`Current month start date: ${currentMonthStart}`);

    // The limits for all families
    const POST_LIMIT = 30;
    const ALBUM_LIMIT = 5;
    const EVENT_LIMIT = 3;

    // Calculate the next month's first day for reset date
    const today = new Date();
    const resetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Return the stats
    return NextResponse.json({
      success: true,
      data: {
        memberCount,
        postStats: {
          currentMonthPosts,
          postLimit: POST_LIMIT,
          resetDate: resetDate.toISOString(),
        },
        albumStats: {
          currentMonthAlbums,
          albumLimit: ALBUM_LIMIT,
          resetDate: resetDate.toISOString(),
        },
        eventStats: {
          currentMonthEvents,
          eventLimit: EVENT_LIMIT,
          resetDate: resetDate.toISOString(),
        }
      },
    });
  } catch (error) {
    console.error("Error getting family stats:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get family stats" },
      { status: 500 }
    );
  }
}
