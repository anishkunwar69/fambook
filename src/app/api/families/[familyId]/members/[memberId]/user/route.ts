import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string; memberId: string } }
) {
  try {
    // Auth check
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { familyId, memberId } = await params;

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

    // Check if user is a member of the family
    const userMembership = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId,
        status: "APPROVED",
      },
    });

    if (!userMembership) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Get the family member and their associated user ID
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        id: memberId,
        familyId,
        status: "APPROVED",
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            fullName: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!familyMember) {
      return NextResponse.json(
        { success: false, message: "Family member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        memberId: familyMember.id,
        userId: familyMember.userId,
        user: familyMember.user,
      },
    });
  } catch (error) {
    console.error("[FAMILY_MEMBER_USER_GET]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 