import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import  prisma from "@/lib/prisma";

// Validation schema for basic info update
const BasicInfoSchema = z.object({
  bio: z.string().nullable(),
  birthPlace: z.string().nullable(),
  currentPlace: z.string().nullable(),
  relationshipStatus: z.string().nullable(),
  languages: z.array(z.string()),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user ID from params
    const { userId } = await params;

    // Verify the user is updating their own profile
    const dbUser = await prisma.user.findUnique({
      where: { externalId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if the user is updating their own profile
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "Target user not found" },
        { status: 404 }
      );
    }

    if (targetUser.externalId !== user.id) {
      return NextResponse.json(
        { success: false, message: "You can only update your own profile" },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const validatedData = BasicInfoSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data",
          errors: validatedData.error.errors,
        },
        { status: 400 }
      );
    }

    // Update the user's basic info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio: validatedData.data.bio,
        birthPlace: validatedData.data.birthPlace,
        currentPlace: validatedData.data.currentPlace,
        relationshipStatus: validatedData.data.relationshipStatus,
        languages: validatedData.data.languages,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Basic information updated successfully",
      data: {
        bio: updatedUser.bio,
        birthPlace: updatedUser.birthPlace,
        currentPlace: updatedUser.currentPlace,
        relationshipStatus: updatedUser.relationshipStatus,
        languages: updatedUser.languages,
      },
    });
  } catch (error) {
    console.error("Error updating basic info:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update basic information",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 