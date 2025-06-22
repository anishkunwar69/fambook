import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { familyId: string; rootId: string; nodeId: string } }
) {
  try {
    // Auth check
    const auth = await currentUser();
    const { familyId, rootId, nodeId } = params;
    
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

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

    // Check if user is an admin of the family
    const member = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId,
        status: "APPROVED",
        role: "ADMIN",
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Only admins can delete family members" },
        { status: 403 }
      );
    }

    // Check if the node exists
    const node = await prisma.rootNode.findUnique({
      where: {
        id: nodeId,
        rootId,
      },
    });

    if (!node) {
      return NextResponse.json(
        { success: false, message: "Node not found" },
        { status: 404 }
      );
    }

    // Check if the node has any relationships
    const relationships = await prisma.rootRelation.findMany({
      where: {
        OR: [
          { fromNodeId: nodeId },
          { toNodeId: nodeId }
        ],
        rootId,
      },
    });

    if (relationships.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Cannot delete a node with existing relationships. Remove all relationships first.",
          canDelete: false
        },
        { status: 400 }
      );
    }

    // Delete the node
    await prisma.rootNode.delete({
      where: {
        id: nodeId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Node deleted successfully",
      canDelete: true
    });
  } catch (error) {
    console.error("Error deleting node:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check if a node can be deleted (has no relationships)
export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string; rootId: string; nodeId: string } }
) {
  try {
    // Auth check
    const auth = await currentUser();
    const { familyId, rootId, nodeId } = params;
    
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

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
    const member = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId,
        status: "APPROVED",
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Check if the node exists
    const node = await prisma.rootNode.findUnique({
      where: {
        id: nodeId,
        rootId,
      },
    });

    if (!node) {
      return NextResponse.json(
        { success: false, message: "Node not found" },
        { status: 404 }
      );
    }

    // Check if the node has any relationships
    const relationships = await prisma.rootRelation.findMany({
      where: {
        OR: [
          { fromNodeId: nodeId },
          { toNodeId: nodeId }
        ],
        rootId,
      },
    });

    const canDelete = relationships.length === 0;

    return NextResponse.json({
      success: true,
      data: {
        canDelete,
        hasRelationships: !canDelete,
        relationshipsCount: relationships.length
      }
    });
  } catch (error) {
    console.error("Error checking node delete status:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
} 