import { z } from "zod";

export const createFamilySchema = z.object({
  name: z
    .string()
    .min(2, "Family name must be at least 2 characters")
    .max(50, "Family name cannot exceed 50 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

export const joinFamilySchema = z.object({
  token: z
    .string()
    .min(1, "Join token is required")
    .max(12, "Invalid join token format"),
});

export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type JoinFamilyInput = z.infer<typeof joinFamilySchema>;

export type Family = {
  id: string;
  name: string;
  description?: string;
  joinToken: string;
  createdAt: Date;
  updatedAt: Date;
  members: FamilyMember[];
};

export type FamilyMember = {
  id: string;
  userId: string;
  familyId: string;
  role: "ADMIN" | "MEMBER";
  status: "PENDING" | "APPROVED" | "REJECTED";
  joinedAt: Date;
  user: {
    id: string;
    fullName: string;
    username?: string;
    imageUrl?: string;
  };
};
