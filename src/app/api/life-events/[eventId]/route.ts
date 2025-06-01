import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updating a life event
const UpdateLifeEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long").optional(),
  eventDate: z.string().refine(
    (date) => !isNaN(new Date(date).getTime()),
    { message: "Invalid date format" }
  ).optional(),
  eventType: z.string().min(1, "Event type is required").optional(),
  location: z.string().optional().nullable(),
});

// GET a single life event
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Get authenticated user
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    console.log(`Fetching life event with ID: ${params.eventId}`);

    // Get the life event
    const lifeEvent = await prisma.lifeEvent.findUnique({
      where: { id: params.eventId },
      include: {
        user: {
          select: {
            id: true,
            externalId: true,
            fullName: true,
            profileImage: true
          }
        }
      }
    });

    if (!lifeEvent) {
      return NextResponse.json(
        { success: false, message: "Life event not found" },
        { status: 404 }
      );
    }

    console.log("Found life event:", lifeEvent);
    
    // Check permissions based on visibility (if implemented later)
    const isSelf = lifeEvent.user.externalId === authUser.id;

    return NextResponse.json({
      success: true,
      data: lifeEvent,
      isSelf
    });
  } catch (error) {
    console.error("Error fetching life event:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch life event",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// UPDATE a life event
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Get authenticated user
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    console.log(`Updating life event with ID: ${params.eventId}`);

    // Get the life event
    const lifeEvent = await prisma.lifeEvent.findUnique({
      where: { id: params.eventId },
      include: {
        user: {
          select: { externalId: true }
        }
      }
    });

    if (!lifeEvent) {
      return NextResponse.json(
        { success: false, message: "Life event not found" },
        { status: 404 }
      );
    }

    // Check if the user owns this event
    if (lifeEvent.user.externalId !== authUser.id) {
      return NextResponse.json(
        { success: false, message: "You can only update your own life events" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    console.log("Received update request:", body);

    const validation = UpdateLifeEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid data", 
          errors: validation.error.format() 
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    console.log("Validated data:", data);

    const updateData: any = {};

    // Only include fields that are provided
    if (data.title !== undefined) updateData.title = data.title;
    if (data.eventDate !== undefined) updateData.eventDate = new Date(data.eventDate);
    if (data.eventType !== undefined) updateData.eventType = data.eventType;
    if (data.location !== undefined) updateData.location = data.location;

    console.log("Update data:", updateData);

    // Update the life event
    const updatedLifeEvent = await prisma.lifeEvent.update({
      where: { id: params.eventId },
      data: updateData
    });

    console.log("Updated life event:", updatedLifeEvent);

    return NextResponse.json({
      success: true,
      message: "Life event updated successfully",
      data: updatedLifeEvent
    });
  } catch (error) {
    console.error("Error updating life event:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to update life event",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE a life event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Get authenticated user
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    console.log(`Deleting life event with ID: ${params.eventId}`);

    // Get the life event
    const lifeEvent = await prisma.lifeEvent.findUnique({
      where: { id: params.eventId },
      include: {
        user: {
          select: { externalId: true }
        }
      }
    });

    if (!lifeEvent) {
      return NextResponse.json(
        { success: false, message: "Life event not found" },
        { status: 404 }
      );
    }

    // Check if the user owns this event
    if (lifeEvent.user.externalId !== authUser.id) {
      return NextResponse.json(
        { success: false, message: "You can only delete your own life events" },
        { status: 403 }
      );
    }

    // Delete the life event
    await prisma.lifeEvent.delete({
      where: { id: params.eventId }
    });

    console.log("Successfully deleted life event");

    return NextResponse.json({
      success: true,
      message: "Life event deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting life event:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to delete life event",
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 