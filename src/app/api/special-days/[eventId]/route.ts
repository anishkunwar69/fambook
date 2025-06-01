import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for validating the event ID from params
const paramsSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
});

// Schema for validating PUT request body
const updateEventSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  date: z.string().optional(), // Expecting ISO string from client
  time: z
    .string()
    .optional()
    .nullable(),
  venue: z
    .string()
    .max(200, "Venue must be less than 200 characters")
    .optional()
    .nullable(),
  type: z.enum(["BIRTHDAY", "ANNIVERSARY", "WEDDING", "GRADUATION", "HOLIDAY", "OTHER"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const authUser = await currentUser();
    const awaitedParams = await params;
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({ where: { externalId: authUser.id } });
    if (!dbUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const paramsValidation = paramsSchema.safeParse(awaitedParams);
    if (!paramsValidation.success) {
      console.error("Zod Params Validation Error (PUT):", JSON.stringify(paramsValidation.error.flatten(), null, 2));
      return NextResponse.json(
        { success: false, message: "Invalid Event ID", errors: paramsValidation.error.errors },
        { status: 400 }
      );
    }
    const { eventId } = paramsValidation.data;

    const body = await request.json();
    const bodyValidation = updateEventSchema.safeParse(body);

    if (!bodyValidation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input", errors: bodyValidation.error.errors },
        { status: 400 }
      );
    }

    const eventToUpdate = await prisma.specialDay.findUnique({
      where: { id: eventId },
      include: { family: { select: { createdById: true } } },
    });

    if (!eventToUpdate) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
    }

    if (eventToUpdate.family.createdById !== dbUser.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You are not the admin of this event's family." },
        { status: 403 }
      );
    }

    const { title, description, date, time, venue, type } = bodyValidation.data;
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description; // Allow setting description to null or empty string
    if (date) updateData.date = new Date(date);
    if (time) updateData.time = time;
    if (venue) updateData.venue = venue;
    if (type) updateData.type = type;

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
            { success: false, message: "No fields provided for update." },
            { status: 400 }
        );
    }

    const updatedEvent = await prisma.specialDay.update({
      where: { id: eventId },
      data: updateData,
    });

    return NextResponse.json(
      { success: true, message: "Event updated successfully", data: updatedEvent },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update event", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const authUser = await currentUser();
    const awaitedParams = await params;
    if (!authUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { externalId: authUser.id } });
    if (!dbUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const paramsValidation = paramsSchema.safeParse(awaitedParams);
    if (!paramsValidation.success) {
      console.error("Zod Params Validation Error (DELETE):", JSON.stringify(paramsValidation.error.flatten(), null, 2));
      return NextResponse.json(
        { success: false, message: "Invalid Event ID", errors: paramsValidation.error.errors },
        { status: 400 }
      );
    }
    const { eventId } = paramsValidation.data;

    const eventToDelete = await prisma.specialDay.findUnique({
      where: { id: eventId },
      include: { family: { select: { createdById: true } } },
    });

    if (!eventToDelete) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
    }

    if (eventToDelete.family.createdById !== dbUser.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You are not the admin of this event's family." },
        { status: 403 }
      );
    }

    // Before deleting the event, update associated albums to remove the event link
    // This prevents errors if the Album.eventId field is non-nullable or has restrictive onDelete behavior
    await prisma.album.updateMany({
      where: { eventId: eventId },
      data: { eventId: null }, // Set eventId to null for associated albums
    });

    await prisma.specialDay.delete({ where: { id: eventId } });

    return NextResponse.json(
      { success: true, message: "Event deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete event", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 