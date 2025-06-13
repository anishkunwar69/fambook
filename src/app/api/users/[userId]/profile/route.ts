import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Types based on Prisma schema
type UserProfile = {
  id: string;
  externalId: string;
  email: string;
  fullName: string;
  username: string | null;
  imageUrl: string | null;
  bio: string | null;
  dob: Date | null;
  firstName: string | null;
  lastName: string | null;
  biography: string | null;
  profileImage: string | null;
  coverImage: string | null;
  dateOfBirth: Date | null;
  relationshipStatus: string | null;
  languages: string[];
  interests: string[];
  currentPlace: string | null;
  birthPlace: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Education = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startYear: number;
  endYear: number | null;
  description: string | null;
};

type WorkHistory = {
  id: string;
  company: string;
  position: string;
  startYear: number;
  endYear: number | null;
  currentlyWorking: boolean;
  location: string | null;
  description: string | null;
};

type FamilyMembership = {
  familyId: string;
  familyName: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  joinedAt: Date;
};

// Helper function to calculate age
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Helper function to check if today is birthday
function isBirthdayToday(birthDate: Date): boolean {
  const today = new Date();
  return today.getMonth() === birthDate.getMonth() && 
         today.getDate() === birthDate.getDate();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get authenticated user
    const authUser = await currentUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Fetch user profile with all related data
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        education: true,
        workHistory: true,
        families: {
          include: {
            family: true
          }
        }
      }
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Calculate age and birthday status
    let age: number | undefined;
    let isBirthday = false;
    if (userProfile.dateOfBirth) {
      age = calculateAge(userProfile.dateOfBirth);
      isBirthday = isBirthdayToday(userProfile.dateOfBirth);
    }

    // Format family memberships
    const familyMemberships = userProfile.families.map(membership => ({
      familyId: membership.familyId,
      familyName: membership.family.name,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt
    }));

    // Build response data
    const responseData = {
      success: true,
      message: "Profile fetched successfully",
      data: {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          fullName: userProfile.fullName,
          username: userProfile.username,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          bio: userProfile.bio,
          biography: userProfile.biography,
          profileImage: userProfile.profileImage || userProfile.imageUrl,
          coverImage: userProfile.coverImage,
          dateOfBirth: userProfile.dateOfBirth,
          age,
          isBirthday,
          currentPlace: userProfile.currentPlace,
          birthPlace: userProfile.birthPlace,
          relationshipStatus: userProfile.relationshipStatus,
          languages: userProfile.languages,
          interests: userProfile.interests,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt
        },
        education: userProfile.education.map(edu => ({
          id: edu.id,
          institution: edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy,
          startYear: edu.startYear,
          endYear: edu.endYear,
          description: edu.description
        })),
        workHistory: userProfile.workHistory.map(work => ({
          id: work.id,
          company: work.company,
          position: work.position,
          startYear: work.startYear,
          endYear: work.endYear,
          currentlyWorking: work.currentlyWorking,
          location: work.location,
          description: work.description
        })),
        familyMemberships,
        isSelf: authUser.id === userId
      }
    };

    // If both firstName and lastName are null but fullName exists, extract them from fullName
    if (responseData.data.user.firstName === null && 
        responseData.data.user.lastName === null && 
        responseData.data.user.fullName) {
      const nameParts = responseData.data.user.fullName.split(' ');
      if (nameParts.length >= 2) {
        responseData.data.user.firstName = nameParts[0];
        responseData.data.user.lastName = nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        responseData.data.user.firstName = nameParts[0];
        responseData.data.user.lastName = '';
      }
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Error in profile API:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 