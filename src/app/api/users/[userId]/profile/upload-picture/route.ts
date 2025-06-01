import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(
  request: NextRequest,
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
        profileImage: true, // Include current profile image for cleanup
      }
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is updating their own profile picture
    if (dbUser.id !== userId) {
      return NextResponse.json(
        { success: false, message: "You can only update your own profile picture" },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('profileImage') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    try {
      // Convert File to base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(fileBase64, {
        folder: "fambook/profile-pictures",
        resource_type: "image",
        public_id: `user_${userId}_${Date.now()}`, // Unique filename
        overwrite: true,
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" }, // Auto-crop to square with face detection
          { quality: "auto:good" }, // Optimize quality
          { format: "auto" } // Auto-format optimization
        ]
      });

      // If user had a previous profile image from Cloudinary, delete it
      if (dbUser.profileImage && dbUser.profileImage.includes('cloudinary.com')) {
        try {
          // Extract public_id from the URL
          const urlParts = dbUser.profileImage.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = `fambook/profile-pictures/${publicIdWithExtension.split('.')[0]}`;
          
          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.error("Error deleting old profile image from Cloudinary:", deleteError);
          // Continue with update even if deletion fails
        }
      }

      // Update user's profile image in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          profileImage: result.secure_url,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Profile picture updated successfully",
        data: {
          profileImageUrl: result.secure_url,
        },
      });
    } catch (uploadError) {
      console.error("Error uploading to Cloudinary:", uploadError);
      return NextResponse.json(
        { success: false, message: "Failed to upload image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 