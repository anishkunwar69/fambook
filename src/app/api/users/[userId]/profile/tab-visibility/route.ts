import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Define validation schema for tab visibility settings
const TabVisibilitySchema = z.object({
  overview: z.string(),
  memories: z.string(),
  timeline: z.string(),
  details: z.string(),
  posts: z.string(),
});

export async function GET(
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

    const { userId } = await params;

    // Get the profile owner from the database
    const profileOwner = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        externalId: true,
        privacySettings: true,
        families: {
          include: {
            family: true
          }
        }
      }
    });

    if (!profileOwner) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get the current viewer from the database to know their family memberships
    const currentViewer = await prisma.user.findUnique({
      where: { externalId: user.id },
      select: {
        id: true,
        externalId: true,
        families: {
          select: {
            familyId: true,
            family: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Extract tab visibility settings or set defaults
    const privacySettings = profileOwner.privacySettings as any || {};
    const tabVisibility = privacySettings.tabVisibility || {
      overview: "everyone",
      memories: "everyone",
      timeline: "everyone",
      details: "everyone",
      posts: "everyone",
    };

    // Get profile owner's families for the response (for selection in settings)
    const ownerFamilies = profileOwner.families.map((membership) => ({
      id: membership.familyId,
      name: membership.family.name,
    }));

    // Get viewer's family ids for visibility checks
    const viewerFamilyIds = currentViewer?.families.map(membership => membership.familyId) || [];

    // Determine if this is the user's own profile
    const isCurrentUserProfile = currentViewer?.id === profileOwner.id;

    // Debug information
    console.log("[Tab Visibility] Profile owner ID:", profileOwner.id);
    console.log("[Tab Visibility] Current viewer ID:", currentViewer?.id);
    console.log("[Tab Visibility] Is own profile:", isCurrentUserProfile);
    console.log("[Tab Visibility] Viewer families:", viewerFamilyIds);
    console.log("[Tab Visibility] Tab settings:", tabVisibility);

    return NextResponse.json({
      success: true,
      data: {
        tabVisibility,
        families: ownerFamilies,
        viewerFamilyIds,
        isCurrentUser: isCurrentUserProfile
      }
    });
  } catch (error) {
    console.error("Error fetching tab visibility settings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { userId } = await params;

    // Get the user from the database
    const dbUser = await prisma.user.findUnique({
      where: { externalId: user.id },
      select: {
        id: true,
        externalId: true,
        privacySettings: true
      }
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is updating their own settings
    if (dbUser.id !== userId) {
      return NextResponse.json(
        { success: false, message: "You can only update your own privacy settings" },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = TabVisibilitySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data format",
          errors: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const settings = validationResult.data;

    // Get current privacy settings or initialize empty object
    const currentSettings = (dbUser.privacySettings as any) || {};

    // Update tab visibility settings
    const updatedSettings = {
      ...currentSettings,
      tabVisibility: settings
    };

    // Save to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        privacySettings: updatedSettings
      }
    });

    console.log("[Tab Visibility] Updated settings:", settings);

    return NextResponse.json({
      success: true,
      message: "Tab visibility settings updated successfully",
      data: { tabVisibility: settings }
    });
  } catch (error) {
    console.error("Error updating tab visibility settings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 