import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Get user's ID
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Get all families where user is either an approved member or has a pending request
    const families = await prisma.family.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
            OR: [{ status: "APPROVED" }, { status: "PENDING" }],
          },
        },
      },
      include: {
        members: {
          where: {
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
        },
        // Include user's own membership status and counts
        _count: {
          select: {
            members: {
              where: {
                status: "PENDING",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get user's membership status and include createdById for each family
    const familiesWithStatusAndCreator = await Promise.all(
      families.map(async (family) => {
        const userMembership = await prisma.familyMember.findFirst({
          where: {
            familyId: family.id,
            userId: user.id,
          },
          select: {
            status: true,
            role: true,
          },
        });

        // Count total approved members directly from the included members array
        const approvedMembersCount = family.members.length;

        // Additional verification count from database (might be redundant but ensuring accuracy)
        const dbApprovedMembersCount = await prisma.familyMember.count({
          where: {
            familyId: family.id,
            status: "APPROVED",
          },
        });

        // Log the counts for debugging
        console.log(`Family ${family.id} member counts:`, {
          fromIncludedMembers: approvedMembersCount,
          fromDirectCount: dbApprovedMembersCount
        });

        // Check if user is admin (either the creator or has ADMIN role)
        const isAdmin =
          family.createdById === user.id || userMembership?.role === "ADMIN";

        return {
          ...family,
          userMembershipStatus: userMembership?.status || null,
          pendingRequestsCount: family._count.members,
          memberCount: dbApprovedMembersCount, // Use the direct count to be safe
          isAdmin, // Include isAdmin flag directly in the API response
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        message: "Families fetched successfully",
        currentInternalUserId: user.id,
        data: familiesWithStatusAndCreator,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch families:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch families",
      },
      { status: 500 }
    );
  }
}
