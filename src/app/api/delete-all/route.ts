import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/response";
import prisma from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    // Delete all records in the correct order to handle foreign key constraints
    await prisma.$transaction(async (tx) => {
      // First, delete models with foreign key dependencies
      await tx.like.deleteMany({});
      await tx.comment.deleteMany({});
      await tx.media.deleteMany({});
      await tx.notification.deleteMany({});
      await tx.note.deleteMany({});
      await tx.post.deleteMany({});
      await tx.rootRelation.deleteMany({}); // Delete family tree relations
      await tx.rootNode.deleteMany({}); // Delete family tree nodes
      await tx.familyRoot.deleteMany({}); // Delete family roots
      await tx.specialDay.deleteMany({});
      await tx.familyMember.deleteMany({});
      await tx.album.deleteMany({});
      await tx.family.deleteMany({});
      await tx.user.deleteMany({});
    });

    return successResponse("All data deleted successfully", null, 200);
  } catch (error) {
    console.error("Failed to delete all data:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to delete all data", 
      null, 
      500
    );
  }
} 