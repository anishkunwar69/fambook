import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Validation schema for updating interests
const InterestsUpdateSchema = z.object({
  interests: z.array(z.string()).min(0)
});

// PATCH endpoint to update user interests
export async function PATCH(
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

    // Check if the user is updating their own profile
    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, message: "Not authorized to update this profile" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = InterestsUpdateSchema.parse(body);

    // Update user interests
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        interests: validatedData.interests
      },
      select: {
        id: true,
        interests: true
      }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Interests updated successfully",
      data: updatedUser
    });

  } catch (error) {
    console.error("Error updating interests:", error);

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
      { success: false, message: "Failed to update interests" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to retrieve user's interests
export async function GET(
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


    // Fetch user's interests
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { interests: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Return the interests data
    return NextResponse.json({
      success: true,
      message: "Interests fetched successfully",
      data: user.interests
    });

  } catch (error) {
    console.error("Error fetching interests:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch interests" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 