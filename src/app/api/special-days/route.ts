import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addMonths, addWeeks, addYears, subDays } from "date-fns";

const createSpecialDaySchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  date: z.string().min(1, "Date is required"),
  time: z
    .string()
    .optional()
    .nullable(),
  venue: z
    .string()
    .max(200, "Venue must be less than 200 characters")
    .optional()
    .nullable(),
  type: z.enum(["BIRTHDAY", "ANNIVERSARY", "WEDDING", "GRADUATION", "HOLIDAY", "OTHER"]),
  familyId: z.string().min(1, "Family ID is required"),
});

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get user
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 3. Get time frame from query params
    const searchParams = request.nextUrl.searchParams;
    const timeFrame = (searchParams.get("timeFrame") || "month").toLowerCase();

    // 4. Calculate date range based on time frame
    const now = new Date();
    let endDate;
    let startDate = subDays(now, 1); // Include today

    // Only set date range if not fetching all events
    if (timeFrame !== "all") {
      switch (timeFrame) {
        case "thisweek":
          endDate = addWeeks(now, 1);
          break;
        case "thismonth":
          endDate = addMonths(now, 1);
          break;
        case "thisyear":
          endDate = addYears(now, 1);
          break;
        default:
          endDate = addMonths(now, 1); // Default to month view
      }
    }

    // 5. Get all families where user is an approved member
    const userFamilies = await prisma.familyMember.findMany({
      where: {
        userId: user.id,
        status: "APPROVED",
      },
      select: {
        familyId: true,
      },
    });

    const familyIds = userFamilies.map((member) => member.familyId);

    // 6. Get special days for all user's families within the time frame
    const specialDays = await prisma.specialDay.findMany({
      where: {
        familyId: {
          in: familyIds,
        },
        ...(timeFrame !== "all" && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
      },
      include: {
        family: {
          select: {
            name: true,
            createdById: true,
          },
        },
        albums: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Map over specialDays to add isFamilyAdmin flag
    const specialDaysWithAdminStatus = specialDays.map(sd => ({
      ...sd,
      isFamilyAdmin: sd.family.createdById === user.id
    }));

    return NextResponse.json({
      success: true,
      message: "Special days fetched successfully",
      data: specialDaysWithAdminStatus,
    });
  } catch (error) {
    console.error("Failed to fetch special days:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch special days",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const auth = await currentUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get user
    const user = await prisma.user.findUnique({
      where: { externalId: auth.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = createSpecialDaySchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input",
          errors: validatedData.error.errors,
        },
        { status: 400 }
      );
    }

    // 4. Check if user is a member of the family
    const member = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId: validatedData.data.familyId,
        status: "APPROVED",
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // 5. Create special day and notifications in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the special day
      const specialDay = await tx.specialDay.create({
        data: {
          title: validatedData.data.title,
          description: validatedData.data.description,
          date: new Date(validatedData.data.date),
          ...(validatedData.data.time && { time: validatedData.data.time }),
          ...(validatedData.data.venue && { venue: validatedData.data.venue }),
          type: validatedData.data.type,
          familyId: validatedData.data.familyId,
        },
        include: {
          family: {
            select: {
              name: true,
            },
          },
        },
      });

      // Get family members to notify
      const familyMembers = await tx.familyMember.findMany({
        where: {
          familyId: validatedData.data.familyId,
          status: "APPROVED",
          NOT: {
            userId: user.id,
          },
        },
      });

      // Create notifications for family members
      await Promise.all(
        familyMembers.map((member) =>
          tx.notification.create({
            data: {
              userId: member.userId,
              type: "SPECIAL_DAY",
              content: `${user.fullName} added a new event "${specialDay.title}" in ${specialDay.family.name}`,
            },
          })
        )
      );

      return specialDay;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Special day created successfully",
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create special day:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create special day",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 