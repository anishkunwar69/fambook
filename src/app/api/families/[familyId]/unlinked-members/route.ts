import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    // Auth check
    const auth = await currentUser();
    const { familyId } = await params;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeLinkedMember = searchParams.get('includeLinkedMember');
    
    console.log("[DEBUG] Fetching unlinked members for family:", familyId);
    console.log("[DEBUG] Include linked member:", includeLinkedMember);

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

    // First get all linked member IDs
    const linkedNodes = await prisma.rootNode.findMany({
      where: {
        root: {
          familyId,
        },
        linkedMemberId: {
          not: null,
        },
      },
      select: {
        linkedMemberId: true,
      },
    });

    const linkedMemberIds = linkedNodes
      .map(node => node.linkedMemberId)
      .filter((id): id is string => id !== null);

    console.log("[DEBUG] Linked member IDs:", linkedMemberIds);

    // Create the exclusion list - exclude all linked members except the one we want to include
    const excludeIds = includeLinkedMember 
      ? linkedMemberIds.filter(id => id !== includeLinkedMember)
      : linkedMemberIds;

    // Get all approved family members that are not linked (or include the specific linked member)
    const unlinkedMembers = await prisma.familyMember.findMany({
      where: {
        familyId,
        status: "APPROVED",
        id: {
          notIn: excludeIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            imageUrl: true,
          },
        },
      },
    });

    console.log("[DEBUG] Unlinked members:", unlinkedMembers);

    // Transform the data to match the expected format
    const transformedMembers = unlinkedMembers.map((member) => ({
      id: member.id,
      fullName: member.user.fullName,
      imageUrl: member.user.imageUrl,
    }));

    return NextResponse.json({
      success: true,
      data: transformedMembers,
    });
  } catch (error) {
    console.error("[UNLINKED_MEMBERS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 