import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for creating a life event
const LifeEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  eventDate: z
    .string()
    .refine((date) => !isNaN(new Date(date).getTime()), {
      message: "Invalid date format",
    }),
  eventType: z.string().min(1, "Event type is required"),
  location: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get internal user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { externalId: authUser.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    console.log("Received create life event request:", body);

    const validation = LifeEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data",
          errors: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    console.log("Validated data:", data);

    // Create the life event
    const lifeEvent = await prisma.lifeEvent.create({
      data: {
        userId: user.id,
        title: data.title,
        eventDate: new Date(data.eventDate),
        eventType: data.eventType,
        location: data.location,
      },
    });

    console.log("Created life event:", lifeEvent);

    return NextResponse.json({
      success: true,
      message: "Life event created successfully",
      data: lifeEvent,
    });
  } catch (error) {
    console.error("Error creating life event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create life event",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
