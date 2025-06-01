import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define strict validation schema
const ProfileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().nullable().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").nullable().optional(),
  currentPlace: z.string().max(100, "Location must be less than 100 characters").nullable().optional(),
  birthPlace: z.string().max(100, "Birth place must be less than 100 characters").nullable().optional(),
  relationshipStatus: z.string().nullable().optional(),
  languages: z.array(z.string()).nullable().optional(),
});

type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 1. Get and validate authenticated user
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    console.log("Received update request:", body);

    const validatedData = ProfileUpdateSchema.parse(body);
    console.log("Validated data:", validatedData);

    

    // 3. Get user from database
    const user = await prisma.user.findUnique({
      where: { externalId: authUser.id },
      select: { 
        id: true, 
        externalId: true,
        firstName: true,
        lastName: true,
        fullName: true,
        dateOfBirth: true,
        bio: true,
        currentPlace: true,
        birthPlace: true,
        relationshipStatus: true,
        languages: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 4. Verify user is updating their own profile
    if (user.externalId !== authUser.id) {
      return NextResponse.json(
        { success: false, message: "Not authorized to update this profile" },
        { status: 403 }
      );
    }

    // 5. Prepare update data - only include fields that are actually provided
    const updateData: any = {};
    
    if ('firstName' in body) updateData.firstName = validatedData.firstName;
    if ('lastName' in body) updateData.lastName = validatedData.lastName;
    if ('firstName' in body || 'lastName' in body) {
      updateData.fullName = `${validatedData.firstName || user.firstName} ${validatedData.lastName || user.lastName}`;
    }
    if ('dateOfBirth' in body) updateData.dateOfBirth = validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : user.dateOfBirth;
    if ('bio' in body) updateData.bio = validatedData.bio;
    if ('currentPlace' in body) updateData.currentPlace = validatedData.currentPlace;
    if ('birthPlace' in body) updateData.birthPlace = validatedData.birthPlace;
    if ('relationshipStatus' in body) updateData.relationshipStatus = validatedData.relationshipStatus;
    if ('languages' in body) updateData.languages = validatedData.languages || user.languages;

    console.log("Update data being sent to database:", updateData);

    // 6. Perform the update
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        dateOfBirth: true,
        bio: true,
        currentPlace: true,
        birthPlace: true,
        relationshipStatus: true,
        languages: true
      }
    });

    console.log("Updated user data:", updatedUser);

    // 7. Return success response
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });

  } catch (error) {
    console.error("Profile update error:", error instanceof Error ? error.message : "Unknown error");

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: "Invalid data provided",
        errors: error.errors
      }, { status: 400 });
    }

    // Handle Prisma errors
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 500 });
    }

    // Handle unknown errors
    return NextResponse.json({
      success: false,
      message: "An unexpected error occurred"
    }, { status: 500 });
  } finally {
    // Cleanup
    await prisma.$disconnect();
  }
} 