import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Validation schema for updating work history
const WorkHistoryUpdateSchema = z.object({
  company: z.string().min(1, "Company name is required").optional(),
  position: z.string().min(1, "Position is required").optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date",
  }).optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date",
  }).nullable().optional(),
  currentlyWorking: z.boolean().optional(),
  location: z.string().nullable().optional(),
  description: z.string().max(500, "Description must be less than 500 characters").nullable().optional(),
});

// Helper function to check authorization
async function checkAuthorization(userId: string, workId: string) {
  const authUser = await currentUser();
  if (!authUser) {
    return { 
      authorized: false, 
      response: NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      )
    };
  }

  // Get the internal user ID from the authenticated user's external ID
  const user = await prisma.user.findUnique({
    where: { externalId: authUser.id },
    select: { id: true }
  });

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    };
  }

  // Check if the user is updating their own work history
  if (user.id !== userId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Not authorized to update this profile" },
        { status: 403 }
      )
    };
  }

  // Verify the work history entry exists and belongs to the user
  const workHistory = await prisma.workHistory.findUnique({
    where: { id: workId },
    select: { userId: true }
  });

  if (!workHistory) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Work history entry not found" },
        { status: 404 }
      )
    };
  }

  if (workHistory.userId !== userId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Not authorized to update this work history entry" },
        { status: 403 }
      )
    };
  }

  return { authorized: true, user };
}

// PATCH endpoint to update a work history entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string, workId: string } }
) {
  try {
    const { userId, workId } = await params;
    
    // Check authorization
    const authCheck = await checkAuthorization(userId, workId);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = WorkHistoryUpdateSchema.parse(body);

    // Create update data object (only including provided fields)
    const updateData: any = {};
    if (validatedData.company !== undefined) updateData.company = validatedData.company;
    if (validatedData.position !== undefined) updateData.position = validatedData.position;
    if (validatedData.startDate !== undefined) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
    if (validatedData.currentlyWorking !== undefined) updateData.currentlyWorking = validatedData.currentlyWorking;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;

    // Update the work history entry
    const updatedWorkHistory = await prisma.workHistory.update({
      where: { id: workId },
      data: updateData
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Work history entry updated successfully",
      data: updatedWorkHistory
    });

  } catch (error) {
    console.error("Error updating work history:", error);

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
      { success: false, message: "Failed to update work history entry" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE endpoint to remove a work history entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string, workId: string } }
) {
  try {
    const { userId, workId } = await params;
    
    // Check authorization
    const authCheck = await checkAuthorization(userId, workId);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    // Delete the work history entry
    await prisma.workHistory.delete({
      where: { id: workId }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Work history entry deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting work history:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete work history entry" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 