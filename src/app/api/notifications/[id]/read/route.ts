import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await currentUser();
    const { id } = await params;
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update notification
    const notification = await prisma.notification.update({
      where: {
        id,
        userId: user.id, // Ensure the notification belongs to the user
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark notification as read",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}