"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ChevronRight,
  Heart,
  Home,
  Loader2,
  MapPin,
  Save,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

// Form schema definition
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.date().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  currentPlace: z.string().max(100).optional(),
  birthPlace: z.string().max(100).optional(),
  relationshipStatus: z.string().optional(),
  languages: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Relationship status options
const relationshipOptions = [
  { value: "Single", label: "Single" },
  { value: "In a relationship", label: "In a relationship" },
  { value: "Engaged", label: "Engaged" },
  { value: "Married", label: "Married" },
  { value: "Divorced", label: "Divorced" },
  { value: "Widowed", label: "Widowed" },
  { value: "It's complicated", label: "It's complicated" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

const SkeletonField = () => (
  <div className="space-y-2">
    <div className="h-4 bg-gray-200 rounded w-1/4" />
    <div className="h-10 bg-gray-200 rounded-md" />
  </div>
);

function ProfileInfoEditPageSkeleton() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-3 w-3 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-12" />
        <div className="h-3 w-3 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>

      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-8 md:h-9 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
      </div>

      {/* Progress bar skeleton */}
      <div className="mb-8">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-10" />
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-gray-200 h-2 rounded-full"
            style={{ width: "0%" }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Card 1: Basic Info Skeleton */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded" />
              <div className="h-5 bg-gray-200 rounded w-40" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-64 mt-2" />
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonField />
              <SkeletonField />
            </div>
            <SkeletonField />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/5" />
              <div className="h-24 bg-gray-200 rounded-md" />
            </div>
          </div>
        </div>

        {/* Card 2: Location Details Skeleton */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded" />
              <div className="h-5 bg-gray-200 rounded w-48" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-72 mt-2" />
          </div>
          <div className="p-6 pt-0 space-y-4">
            <SkeletonField />
            <SkeletonField />
          </div>
        </div>

        {/* Card 3: Personal Details Skeleton */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded" />
              <div className="h-5 bg-gray-200 rounded w-44" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-64 mt-2" />
          </div>
          <div className="p-6 pt-0 space-y-4">
            <SkeletonField />
            <SkeletonField />
          </div>
        </div>
      </div>

      {/* Buttons Skeleton */}
      <div className="flex justify-end gap-3 mt-8">
        <div className="h-10 bg-gray-200 rounded-md w-24" />
        <div className="h-10 bg-gray-200 rounded-md w-32" />
      </div>
    </div>
  );
}

export default function ProfileInfoEditPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [formProgress, setFormProgress] = useState(0);
  const queryClient = useQueryClient();

  // Fetch the current user's profile data
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/profile`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      console.log("Profile data:", data);
      return data;
    },
  });

  // Initialize the form with default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: undefined,
      bio: "",
      currentPlace: "",
      birthPlace: "",
      relationshipStatus: undefined,
      languages: "",
    },
    mode: "onChange",
  });

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profileData?.data) {
      const { user } = profileData.data;

      const resetValues = {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
        bio: user.bio || "",
        currentPlace: user.currentPlace || "",
        birthPlace: user.birthPlace || "",
        relationshipStatus: user.relationshipStatus || undefined,
        languages: user.languages ? user.languages.join(", ") : "",
      };

      form.reset(resetValues);
    }
  }, [profileData, form]);

  // Calculate form completion progress
  useEffect(() => {
    const values = form.getValues();
    const totalFields = 8; // Total number of fields to track
    let completedFields = 0;

    if (values.firstName) completedFields++;
    if (values.lastName) completedFields++;
    if (values.dateOfBirth) completedFields++;
    if (values.bio) completedFields++;
    if (values.currentPlace) completedFields++;
    if (values.birthPlace) completedFields++;
    if (values.relationshipStatus && values.relationshipStatus.trim())
      completedFields++;
    if (values.languages) completedFields++;

    setFormProgress(Math.round((completedFields / totalFields) * 100));
  }, [form.watch()]);

  // Profile update mutation
  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const formattedValues = {
        ...values,
        languages: values.languages
          ? values.languages.split(",").map((lang) => lang.trim())
          : [],
        dateOfBirth: values.dateOfBirth?.toISOString(),
        relationshipStatus:
          values.relationshipStatus && values.relationshipStatus.trim()
            ? values.relationshipStatus.trim()
            : null,
      };

      const toastId = toast.loading("Updating profile...");

      try {
        const response = await fetch(`/api/users/${userId}/profile/update`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formattedValues),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error("Failed to update profile");
        }

        toast.success("Profile updated successfully", {
          id: toastId,
        });

        return data;
      } catch (error) {
        toast.error(
          "Failed to update profile",
          {
            id: toastId,
          }
        );
        throw error;
      }
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["userProfile", userId] });

      // Save previous data
      const previousData = queryClient.getQueryData(["userProfile", userId]);

      // Optimistically update the cache
      queryClient.setQueryData(["userProfile", userId], (old: any) => ({
        ...old,
        data: {
          ...old.data,
          user: {
            ...old.data.user,
            firstName: newData.firstName,
            lastName: newData.lastName,
            dateOfBirth: newData.dateOfBirth,
            bio: newData.bio,
            relationshipStatus: newData.relationshipStatus,
            currentPlace: newData.currentPlace,
            birthPlace: newData.birthPlace,
            languages: newData.languages
              ? newData.languages.split(",").map((lang) => lang.trim())
              : [],
          },
        },
      }));

      return { previousData };
    },
    onError: (error: Error, variables, context) => {
      // Revert the optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(["userProfile", userId], context.previousData);
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });

      // Navigate back to profile page after a short delay to allow the toast to be seen
      setTimeout(() => {
        router.push(`/profile/${userId}`);
      }, 1000);
    },
  });

  // Handle form submission
  const onSubmit = (values: ProfileFormValues) => {
    updateProfile(values);
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/profile/${userId}`);
  };

  if (isLoadingProfile) {
    return <ProfileInfoEditPageSkeleton />;
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 max-lg:pb-20">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center"
        >
          <Home className="w-3.5 h-3.5 mr-1" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          href={`/profile/${userId}`}
          className="hover:text-rose-500 transition-colors"
        >
          Profile
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-rose-500 font-medium">Edit Profile</span>
      </div>

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
          Edit Profile Information
        </h1>
        <p className="text-gray-500 mt-1 text-xs xs:text-sm md:text-base">
          Update your personal information to help family members connect with
          you.
        </p>
      </div>

      {/* Form progress */}
      <div className="mb-4 sm:mb-8">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="font-medium text-gray-600">Form Completion</span>
          <span className="font-medium text-rose-600">{formProgress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-rose-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${formProgress}%` }}
          ></div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <User className="h-4 sm:h-5 w-4 sm:w-5 text-rose-500" />
                <CardTitle>Basic Information</CardTitle>
              </div>
              <CardDescription className="sm:text-sm text-xs md:text-base">
                Edit your name, birthday, and other basic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date of birth */}
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value ? format(field.value, "yyyy-MM-dd") : ""
                        }
                        onChange={(e) => {
                          const dateString = e.target.value;
                          if (dateString) {
                            const date = new Date(dateString);
                            const userTimezoneOffset =
                              date.getTimezoneOffset() * 60000;
                            field.onChange(
                              new Date(date.getTime() + userTimezoneOffset)
                            );
                          } else {
                            field.onChange(undefined);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription className="sm:text-sm text-xs md:text-base">
                      Your date of birth will be used to calculate your age and
                      remind family members of your birthday.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell your family a little about yourself..."
                        className="resize-none min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center">
                      <FormDescription className="sm:text-sm text-xs md:text-base">
                        A short bio to introduce yourself to your family.
                      </FormDescription>
                      <span className="text-xs text-gray-400">
                        {field.value?.length || 0}/500
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-rose-500" />
                <CardTitle>Location Details</CardTitle>
              </div>
              <CardDescription className="sm:text-sm text-xs md:text-base">
                Where you're from and where you live now
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current location */}
              <FormField
                control={form.control}
                name="currentPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., San Francisco, California"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="sm:text-sm text-xs md:text-base">
                      Where you currently live
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Birth place */}
              <FormField
                control={form.control}
                name="birthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Place</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chicago, Illinois" {...field} />
                    </FormControl>
                    <FormDescription className="sm:text-sm text-xs md:text-base">
                      Where you were born
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Heart className="h-4 sm:h-5 w-4 sm:w-5 text-rose-500" />
                <CardTitle>Personal Details</CardTitle>
              </div>
              <CardDescription className="sm:text-sm text-xs md:text-base">
                Additional information about yourself
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Relationship status */}
              <FormField
                control={form.control}
                name="relationshipStatus"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Relationship Status</FormLabel>
                      <Select
                        key={`relationship-${field.value || "empty"}`}
                        onValueChange={(value) => {
                          field.onChange(value === "clear" ? undefined : value);
                        }}
                        {...(field.value ? { value: field.value } : {})}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your relationship status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clear" className="text-gray-500">
                            <em>Clear selection</em>
                          </SelectItem>
                          {relationshipOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Languages */}
              <FormField
                control={form.control}
                name="languages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Languages</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., English, Spanish, Mandarin"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="sm:text-sm text-xs md:text-base">
                      Languages you speak (separate with commas)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-rose-500 hover:bg-rose-600 gap-2"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
