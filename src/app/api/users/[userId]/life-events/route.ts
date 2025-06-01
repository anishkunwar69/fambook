import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get authenticated user for permission checks
    const authUser = await currentUser();
    const { userId } = await params;

    console.log("Fetching life events for userId:", userId);

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get the internal user ID from the provided userId (not the authenticated user's ID)
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, externalId: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log("Target user found:", targetUser);

    // Define the type for life events
    type LifeEvent = {
      id: string;
      title: string;
      eventDate: Date;
      location?: string | null;
      eventType: string;
      userId: string;
      createdAt: Date;
      updatedAt: Date;
    };

    // Fetch life events for the target user with pagination
    const lifeEvents = await prisma.lifeEvent.findMany({
      where: {
        userId: targetUser.id,
      },
      orderBy: {
        eventDate: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    console.log(
      `Found ${lifeEvents.length} life events for user (page ${page})`
    );

    // Group events by year
    const eventsByYear: Record<number, LifeEvent[]> = {};

    lifeEvents.forEach((event: LifeEvent) => {
      const year = new Date(event.eventDate).getFullYear();
      if (!eventsByYear[year]) {
        eventsByYear[year] = [];
      }
      eventsByYear[year].push(event);
    });

    // Convert to array of year groups sorted by year descending
    const groupedEvents = Object.entries(eventsByYear)
      .map(([year, events]) => ({
        year: parseInt(year),
        events,
      }))
      .sort((a, b) => b.year - a.year);

    const isSelf = authUser.id === targetUser.externalId;
    console.log("Is self profile:", isSelf);

    return NextResponse.json({
      success: true,
      data: groupedEvents,
      isSelf,
      pagination: {
        page,
        limit,
        hasMore: lifeEvents.length === limit,
      },
    });
  } catch (error) {
    console.error(
      "Error fetching life events:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch life events",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
