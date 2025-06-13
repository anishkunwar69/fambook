import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from 'cloudinary';
import { MediaType } from '@prisma/client';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to extract public_id from Cloudinary URL
function getPublicIdFromUrl(url: string): string | null {
  try {
    const parts = url.split('/');
    // Assuming URL structure like .../upload/vXXXXX/folder/filename.ext
    // or .../upload/folder/filename.ext
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex + 1 >= parts.length) return null;

    // Check if there's a version component (e.g., v1234567)
    let pathWithFolderAndFile;
    if (parts[uploadIndex + 1].startsWith('v') && Number.isInteger(Number(parts[uploadIndex + 1].substring(1)))) {
      pathWithFolderAndFile = parts.slice(uploadIndex + 2).join('/');
    } else {
      pathWithFolderAndFile = parts.slice(uploadIndex + 1).join('/');
    }
    
    const publicIdWithExtension = pathWithFolderAndFile;
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
    if (lastDotIndex === -1) return publicIdWithExtension; // No extension
    return publicIdWithExtension.substring(0, lastDotIndex);
  } catch (error) {
    console.error("Error parsing Cloudinary URL:", error);
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    if (!postId) {
      return NextResponse.json({ success: false, message: "Post ID is required" }, { status: 400 });
    }

    // Fetch the post with its media to get author and media details
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { 
        media: true, // Include media to delete from Cloudinary
        user: { select: { externalId: true }} // To check ownership against Clerk's externalId
      },
    });

    if (!post) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    // Authorization check: Ensure the logged-in user is the post author
    if (post.user.externalId !== authUser.id) {
      return NextResponse.json({ success: false, message: "Forbidden: You are not the author of this post" }, { status: 403 });
    }

    // Delete media from Cloudinary
    for (const mediaItem of post.media) {
      const publicId = getPublicIdFromUrl(mediaItem.url);
      if (publicId) {
        try {
          const resourceType = mediaItem.type === MediaType.PHOTO ? 'image' : 'video';
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
          console.log(`Successfully deleted ${publicId} from Cloudinary.`);
        } catch (cloudinaryError) {
          console.error(`Failed to delete ${publicId} from Cloudinary:`, cloudinaryError);
          // Decide if this should be a fatal error or if we proceed to delete DB record
          // For now, we'll log and continue, but this might leave orphaned files in Cloudinary
        }
      }
    }

    // Delete post from database
    // Prisma's `onDelete: Cascade` on Media.post should handle deleting associated Media records in DB
    await prisma.post.delete({
      where: { id: postId },
    });

    return new NextResponse(null, { status: 204 }); // Success, No Content

  } catch (error) {
    console.error("Error deleting post:", error);
    let message = "Internal server error";
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    if (!postId) {
      return NextResponse.json({ success: false, message: "Post ID is required" }, { status: 400 });
    }

    // Fetch the existing post to verify ownership
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, user: { select: { externalId: true }} },
    });

    if (!existingPost) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    if (existingPost.user.externalId !== authUser.id) {
      return NextResponse.json({ success: false, message: "Forbidden: You are not the author of this post" }, { status: 403 });
    }

    // Handle FormData instead of JSON
    const formData = await request.formData();
    const text = formData.get('text') as string;
    const mediaToRemoveIds = formData.getAll('mediaToRemove[]').map(id => id.toString());
    const newMediaFiles = formData.getAll('newMediaFiles');
    const operations: any[] = [];

    // 1. Handle media to remove
    if (mediaToRemoveIds && mediaToRemoveIds.length > 0) {
      for (const mediaId of mediaToRemoveIds) {
        const mediaItem = await prisma.media.findUnique({ where: { id: mediaId } });
        if (mediaItem) {
          const publicId = getPublicIdFromUrl(mediaItem.url);
          if (publicId) {
            try {
              const resourceType = mediaItem.type === MediaType.PHOTO ? 'image' : 'video';
              await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            } catch (cloudinaryError) {
              // Log and continue
              console.error("Error deleting from Cloudinary:", cloudinaryError);
            }
          }
          operations.push(prisma.media.delete({ where: { id: mediaId } }));
        }
      }
    }

    // 2. Handle new media files (upload to Cloudinary)
    if (newMediaFiles && newMediaFiles.length > 0) {
      for (const fileItem of newMediaFiles) {
        if (fileItem instanceof File) {
          try {
            // Determine file type
            const isVideo = fileItem.type.startsWith('video/');
            const resourceType = isVideo ? 'video' : 'image';
            const mediaType = isVideo ? MediaType.VIDEO : MediaType.PHOTO;
            
            // Convert File to buffer for Cloudinary upload
            const arrayBuffer = await fileItem.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Upload to Cloudinary
            const result = await new Promise<any>((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: resourceType },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              
              // Write buffer to stream
              uploadStream.write(buffer);
              uploadStream.end();
            });
            
            // Add to database
            operations.push(
              prisma.media.create({
                data: {
                  url: result.secure_url,
                  type: mediaType,
                  postId: postId,
                },
              })
            );
          } catch (error) {
            console.error("Error uploading media:", error);
            // Continue with other files if one fails
          }
        }
      }
    }

    // 3. Update post text
    operations.push(
      prisma.post.update({
        where: { id: postId },
        data: { text: text || null },
      })
    );

    // Execute all operations in a transaction
    await prisma.$transaction(operations);

    // Fetch the updated post to return
    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { media: true, user: {select: {id: true, fullName: true, imageUrl: true}}, family: {select: {id: true, name: true}}, _count: {select: {likes: true, comments: true}} },
    });

    return NextResponse.json({ success: true, data: updatedPost });

  } catch (error) {
    let message = "Internal server error while updating post.";
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}