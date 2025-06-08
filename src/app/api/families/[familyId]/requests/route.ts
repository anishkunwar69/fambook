import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch pending requests
export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    // 1. Get and validate params
    const {familyId} = await params;
    if (!familyId) {
      return NextResponse.json(
        { success: false, message: "Family ID is required" },
        { status: 400 }
      );
    }

    // 2. Auth check
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 3. Get user
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 4. Check if user is an admin of the family
    const member = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId,
        role: "ADMIN",
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // 5. Get pending requests
    const pendingRequests = await prisma.familyMember.findMany({
      where: {
        familyId,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            imageUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pending requests fetched successfully",
      data: pendingRequests,
    });
  } catch (error) {
    console.error("Failed to fetch pending requests:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch pending requests" },
      { status: 500 }
    );
  }
}

// POST: Update request status (approve/reject)
export async function POST(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    // 1. Get and validate params
    const {familyId} = await params;
    if (!familyId) {
      return NextResponse.json(
        { success: false, message: "Family ID is required" },
        { status: 400 }
      );
    }

    // 2. Auth check
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const { memberId, action } = body;

    if (!memberId || !action || !["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid input" },
        { status: 400 }
      );
    }

    // 4. Get user
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 5. Check if user is an admin
    const adminMember = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId,
        role: "ADMIN",
      },
    });

    if (!adminMember) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // 6. Update member status and create notifications in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get the member and family details
      const [member, family] = await Promise.all([
        tx.familyMember.findUnique({
          where: { id: memberId },
          include: { user: true },
        }),
        tx.family.findUnique({
          where: { id: familyId },
        }),
      ]);

      if (!member || !family) {
        throw new Error("Member or family not found");
      }

      let updatedMember;
      if (action === "REJECTED") {
        // If rejected, delete the membership record entirely
        updatedMember = await tx.familyMember.delete({
          where: { id: memberId },
          include: { user: true }, // still include user for the notification
        });
      } else {
        // If approved, update the status
        updatedMember = await tx.familyMember.update({
          where: { id: memberId },
          data: { status: "APPROVED" },
          include: { user: true },
        });
      }

      // Create notification for the requesting user
      await tx.notification.create({
        data: {
          userId: member.userId,
          type: action === "APPROVED" ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
          content:
            action === "APPROVED"
              ? `Your request to join "${family.name}" has been approved!`
              : `Your request to join "${family.name}" has been rejected.`,
        },
      });

      // If approved, notify all family members about the new member
      if (action === "APPROVED") {
        const familyMembers = await tx.familyMember.findMany({
          where: {
            familyId,
            status: "APPROVED",
            NOT: { userId: member.userId },
          },
        });

        await Promise.all(
          familyMembers.map((fm) =>
            tx.notification.create({
              data: {
                userId: fm.userId,
                type: "NEW_MEMBER",
                content: `${member.user.fullName} has joined "${family.name}"!`,
              },
            })
          )
        );
      }

      return updatedMember;
    });

    return NextResponse.json({
      success: true,
      message: `Request ${action.toLowerCase()} successfully`,
      data: {
        member: result,
        action,
      },
    });


    //close transaction
    await prisma.$disconnect();

  } catch (error) {
    console.error("Failed to update request:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update request",
      },
      { status: 500 }
    );
  }
} 