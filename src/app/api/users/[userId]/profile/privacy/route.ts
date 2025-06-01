import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// Define validation schema for privacy settings
const privacySettingsSchema = z.record(z.enum(['public', 'family', 'private']));

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Auth check
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Ensure user is updating their own privacy settings
    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, message: "You can only update your own privacy settings" },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validationResult = privacySettingsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid privacy settings", 
          errors: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const validatedSettings = validationResult.data;

    // Update privacy settings
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        privacySettings: validatedSettings
      }
    });

    // Default privacy settings to compare what's been changed
    const defaultSettings = {
      showBirthPlace: 'family',
      showCurrentPlace: 'public',
      showLanguages: 'family',
      showRelationshipStatus: 'family',
      showEducation: 'public',
      showWork: 'public',
      showInterests: 'public',
      showCustomFields: 'public'
    } as const;

    // Merge with user settings
    const mergedSettings = { ...defaultSettings, ...validatedSettings };

    return NextResponse.json({
      success: true,
      message: "Privacy settings updated successfully",
      data: {
        privacySettings: mergedSettings
      }
    });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update privacy settings", error: (error as Error).message },
      { status: 500 }
    );
  }
} 