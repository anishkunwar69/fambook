import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { NextResponse } from "next/server";

const joinFamilySchema = z.object({
  token: z.string().min(1).max(12),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate body
    const body = await request.json();
    const validatedData = joinFamilySchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid input",
        errors: validatedData.error.errors 
      }, { status: 400 });
    }

    // 3. Get or create user
    const user = await prisma.user.upsert({
      where: { externalId: auth.id },
      update: {},
      create: {
        externalId: auth.id,
        email: auth.emailAddresses[0].emailAddress,
        fullName: auth.fullName || `${auth.firstName} ${auth.lastName}`,
        imageUrl: auth.imageUrl,
      },
    });

    // 4. Find the family by join token
    const family = await prisma.family.findUnique({
      where: { joinToken: validatedData.data.token },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!family) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid invite code" 
      }, { status: 404 });
    }

    // 5. Check if user is already a member
    if (family.members.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: "You are already a member of this family" 
      }, { status: 400 });
    }

    // 6. Create pending family member and notifications in a transaction
    const { member, familyAdmins } = await prisma.$transaction(async (tx) => {
      // Add user as pending family member
      const member = await tx.familyMember.create({
        data: {
          userId: user.id,
          familyId: family.id,
          role: "MEMBER",
          status: "PENDING",
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
      });

      // Get family admins
      const familyAdmins = await tx.familyMember.findMany({
        where: {
          familyId: family.id,
          role: "ADMIN",
        },
        include: {
          user: true,
        },
      });

      // Create notification for the requesting user
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "JOIN_REQUEST",
          content: `Your request to join "${family.name}" has been submitted. Please wait for admin approval.`,
        },
      });

      // Create notifications for all family admins
      for (const admin of familyAdmins) {
        await tx.notification.create({
          data: {
            userId: admin.userId,
            type: "JOIN_REQUEST",
            content: `${user.fullName} has requested to join "${family.name}". Please review their request.`,
          },
        });
      }

      return { member, familyAdmins };
    });

    // 7. Return success response
    return NextResponse.json({
      success: true,
      message: "Join request submitted successfully",
      data: {
        familyId: family.id,
        member,
        status: "PENDING",
        admins: familyAdmins.length,
      },
    }, { status: 200 });

    //close transaction
    await prisma.$disconnect();

  } catch (error) {
    console.error("Family join error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to submit join request",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 