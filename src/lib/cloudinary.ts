import { v2 as cloudinary } from 'cloudinary';
import { MediaType } from '@prisma/client';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(file: File) {
  try {
    // Convert file to base64
    const fileBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');
    const fileType = file.type;
    const base64FileWithPrefix = `data:${fileType};base64,${base64File}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64FileWithPrefix, {
      folder: 'fambook', // All uploads will go to this folder in Cloudinary
      resource_type: 'auto', // Automatically detect if it's an image or video
    });

    return {
      url: result.secure_url,
      type: result.resource_type === 'image' ? MediaType.PHOTO : MediaType.VIDEO,
    };
  } catch (error) {
    console.error('Failed to upload to Cloudinary:', error);
    throw error;
  }
} 