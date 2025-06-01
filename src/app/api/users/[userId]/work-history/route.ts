import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Validation schema for creating/updating work history
const WorkHistorySchema = z.object({
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date",
  }).nullable().optional(),
  currentlyWorking: z.boolean().default(false),
  location: z.string().nullable().optional(),
  description: z.string().max(500, "Description must be less than 500 characters").nullable().optional(),
});

// GET endpoint to retrieve user's work history
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
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

    const { userId } = await params;

    // Fetch work history entries
    const workHistoryEntries = await prisma.workHistory.findMany({
      where: { userId: userId },
      orderBy: { startDate: 'desc' }
    });

    // Return the work history data
    return NextResponse.json({
      success: true,
      message: "Work history fetched successfully",
      data: workHistoryEntries
    });

  } catch (error) {
    console.error("Error fetching work history:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch work history" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST endpoint to add a new work history entry
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get authenticated user
    const authUser = await currentUser();
    const { userId } = await params;
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the internal user ID from the authenticated user's external ID
    const user = await prisma.user.findUnique({
      where: { externalId: authUser.id },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if the user is adding to their own profile
    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, message: "Not authorized to update this profile" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = WorkHistorySchema.parse(body);

    // Create new work history entry
    const newWorkHistory = await prisma.workHistory.create({
      data: {
        userId: user.id,
        company: validatedData.company,
        position: validatedData.position,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        currentlyWorking: validatedData.currentlyWorking,
        location: validatedData.location,
        description: validatedData.description,
      }
    });

    // Return success response with the created work history entry
    return NextResponse.json({
      success: true,
      message: "Work history entry added successfully",
      data: newWorkHistory
    });

  } catch (error) {
    console.error("Error adding work history:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: "Invalid data provided",
        errors: error.errors
      }, { status: 400 });
    }

    // Handle other errors
    return NextResponse.json(
      { success: false, message: "Failed to add work history entry" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 