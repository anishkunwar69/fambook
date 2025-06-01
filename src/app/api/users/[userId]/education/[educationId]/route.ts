import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Validation schema for updating education
const EducationUpdateSchema = z.object({
  institution: z.string().min(1, "Institution name is required").optional(),
  degree: z.string().min(1, "Degree is required").optional(),
  fieldOfStudy: z.string().nullable().optional(),
  startYear: z.number().int().min(1900, "Start year must be at least 1900").optional(),
  endYear: z.number().int().min(1900, "End year must be at least 1900").nullable().optional(),
  description: z.string().max(500, "Description must be less than 500 characters").nullable().optional(),
});

// Helper function to check authorization
async function checkAuthorization(userId: string, educationId: string) {
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

  // Check if the user is updating their own education
  if (user.id !== userId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Not authorized to update this profile" },
        { status: 403 }
      )
    };
  }

  // Verify the education entry exists and belongs to the user
  const education = await prisma.education.findUnique({
    where: { id: educationId },
    select: { userId: true }
  });

  if (!education) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Education entry not found" },
        { status: 404 }
      )
    };
  }

  if (education.userId !== userId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Not authorized to update this education entry" },
        { status: 403 }
      )
    };
  }

  return { authorized: true, user };
}

// PATCH endpoint to update an education entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string, educationId: string } }
) {
  try {
    const { userId, educationId } = await params;
    
    // Check authorization
    const authCheck = await checkAuthorization(userId, educationId);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = EducationUpdateSchema.parse(body);

    // Update the education entry
    const updatedEducation = await prisma.education.update({
      where: { id: educationId },
      data: {
        institution: validatedData.institution,
        degree: validatedData.degree,
        fieldOfStudy: validatedData.fieldOfStudy,
        startYear: validatedData.startYear,
        endYear: validatedData.endYear,
        description: validatedData.description,
      }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Education entry updated successfully",
      data: updatedEducation
    });

  } catch (error) {
    console.error("Error updating education:", error);

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
      { success: false, message: "Failed to update education entry" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE endpoint to remove an education entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string, educationId: string } }
) {
  try {
    const { userId, educationId } = await params;
    
    // Check authorization
    const authCheck = await checkAuthorization(userId, educationId);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    // Delete the education entry
    await prisma.education.delete({
      where: { id: educationId }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Education entry deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting education:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete education entry" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 