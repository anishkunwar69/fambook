import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for creating/updating education
const EducationSchema = z.object({
  institution: z.string().min(1, "Institution name is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().nullable().optional(),
  startYear: z.number().int().min(1900, "Start year must be at least 1900"),
  endYear: z
    .number()
    .int()
    .min(1900, "End year must be at least 1900")
    .nullable()
    .optional(),
});

// GET endpoint to retrieve user's education history
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

    // Fetch education entries
    const educationEntries = await prisma.education.findMany({
      where: { userId: userId },
      orderBy: { startYear: "desc" },
    });

    // Return the education data
    return NextResponse.json({
      success: true,
      message: "Education history fetched successfully",
      data: educationEntries,
    });
  } catch (error) {
    console.error("Error fetching education:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch education history" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST endpoint to add a new education entry
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
      select: { id: true },
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
    const validatedData = EducationSchema.parse(body);

    // Create new education entry
    const newEducation = await prisma.education.create({
      data: {
        userId: user.id,
        institution: validatedData.institution,
        degree: validatedData.degree,
        fieldOfStudy: validatedData.fieldOfStudy,
        startYear: validatedData.startYear,
        endYear: validatedData.endYear,
      },
    });

    // Return success response with the created education entry
    return NextResponse.json({
      success: true,
      message: "Education entry added successfully",
      data: newEducation,
    });
  } catch (error) {
    console.error("Error adding education:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data provided",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { success: false, message: "Failed to add education entry" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
