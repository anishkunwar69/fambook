import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    const auth = await currentUser();
    const { familyId } = await params;
    
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's ID
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is a member of this family
    const familyMembership = await prisma.familyMember.findFirst({
      where: {
        familyId: familyId,
        userId: user.id,
        status: "APPROVED",
      },
    });

    if (!familyMembership) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Fetch family members with pagination
    const members = await prisma.familyMember.findMany({
      where: {
        familyId: familyId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            imageUrl: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // ADMIN first, then MEMBER
        { joinedAt: "asc" }, // Older members first within each role
      ],
      skip: skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      message: "Members fetched successfully",
      data: members,
    });
  } catch (error) {
    console.error("Failed to fetch family members:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch family members" },
      { status: 500 }
    );
  }
} 