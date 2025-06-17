"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ImageIcon, Link2, Loader2, Upload, UserCheck2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";

// Add type for family member
type FamilyMember = {
  id: string;
  fullName: string;
  imageUrl: string | null;
};

// Update the member schema to include linkedMemberId
const memberSchema = z
  .object({
    // Required Fields
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z\s-']+$/,
        "First name can only contain letters, spaces, hyphens, and apostrophes"
      ),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z\s-']+$/,
        "Last name can only contain letters, spaces, hyphens, and apostrophes"
      ),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
      required_error: "Please select a gender",
      invalid_type_error: "Gender must be MALE, FEMALE, or OTHER",
    }),
    dateOfBirth: z
      .date({
        required_error: "Date of birth is required",
        invalid_type_error: "Invalid date format",
      })
      .refine((date) => date <= new Date(), {
        message: "Date of birth cannot be in the future",
      }),
    isAlive: z.boolean({
      required_error: "Living status is required",
      invalid_type_error: "Living status must be a boolean",
    }),
    dateOfDeath: z
      .date()
      .nullable()
      .refine(
        (date) => {
          if (date === null) return true;
          return date > new Date("1900-01-01") && date <= new Date();
        },
        {
          message:
            "Date of death must be after 1900 and cannot be in the future",
        }
      ),
    birthPlace: z
      .string()
      .min(2, "Birth place must be at least 2 characters")
      .max(100, "Birth place cannot exceed 100 characters"),
    currentPlace: z
      .string()
      .min(2, "Current place must be at least 2 characters")
      .max(100, "Current place cannot exceed 100 characters"),

    // Optional Fields
    profileImage: z.string().nullable(),
    biography: z
      .string()
      .nullable()
      .refine((val) => !val || val.length >= 10, {
        message: "Biography must be at least 10 characters",
      })
      .refine((val) => !val || val.length <= 1000, {
        message: "Biography cannot exceed 1000 characters",
      }),
    customFields: z.record(z.any()).nullable(),
    linkedMemberId: z.string().nullable(),
  })
  .refine(
    (data) => {
      // If person is not alive, date of death is required
      if (!data.isAlive && !data.dateOfDeath) {
        return false;
      }
      // If date of death is provided, it must be after date of birth
      if (data.dateOfDeath && data.dateOfDeath <= data.dateOfBirth) {
        return false;
      }
      return true;
    },
    {
      message:
        "Date of death must be provided for deceased members and must be after date of birth",
      path: ["dateOfDeath"],
    }
  );

type MemberDetailsProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: z.infer<typeof memberSchema>) => Promise<void>;
  initialData?: Partial<z.infer<typeof memberSchema>>;
  mode: "add" | "edit" | "view";
  familyId: string;
  isAdmin?: boolean;
};

export function MemberDetailsDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  familyId,
  isAdmin = false,
}: MemberDetailsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isViewMode = mode === "view";
  const canEdit = true;

  // Calculate form completion status
  const formValues = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      dateOfBirth: initialData?.dateOfBirth
        ? new Date(initialData.dateOfBirth)
        : new Date(),
      dateOfDeath: initialData?.dateOfDeath
        ? new Date(initialData.dateOfDeath)
        : null,
      gender: initialData?.gender || "MALE",
      isAlive: initialData?.isAlive ?? true,
      birthPlace: initialData?.birthPlace || "",
      currentPlace: initialData?.currentPlace || "",
      profileImage: initialData?.profileImage || null,
      biography: initialData?.biography || null,
      customFields: initialData?.customFields || {},
      linkedMemberId: initialData?.linkedMemberId || null,
    },
  })?.getValues();
  const isFormComplete = useMemo(() => {
    if (!formValues) return false;

    const hasProfileImage = !!formValues.profileImage;
    const hasBiography =
      formValues.biography && formValues.biography.length >= 100;

    return hasProfileImage && hasBiography;
  }, [formValues]);

  const defaultValues: z.infer<typeof memberSchema> = {
    firstName: "",
    lastName: "",
    gender: "MALE" as const,
    dateOfBirth: new Date(),
    isAlive: true,
    dateOfDeath: null,
    birthPlace: "",
    currentPlace: "",
    profileImage: null,
    biography: "",
    customFields: {},
    linkedMemberId: null,
  };

  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues,
  });

  // Fetch unlinked members
  const { data: unlinkedMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["unlinked-members", familyId, mode, initialData?.linkedMemberId],
    queryFn: async () => {
      const currentLinkedMemberId =
        mode === "edit" ? initialData?.linkedMemberId : null;
      const url = currentLinkedMemberId
        ? `/api/families/${familyId}/unlinked-members?includeLinkedMember=${currentLinkedMemberId}`
        : `/api/families/${familyId}/unlinked-members`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch unlinked members");
      }
      const data = await response.json();
      return data.data as FamilyMember[];
    },
    enabled: isOpen && !!familyId,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "add") {
        // Reset to default values for new member
        form.reset(defaultValues);
      } else if (mode === "edit" && initialData) {
        // For edit mode, wait for unlinked members to load if there's a linked member
        const shouldWaitForMembers =
          initialData.linkedMemberId && isLoadingMembers;

        console.log(
          "[DEBUG] Edit mode - linkedMemberId:",
          initialData.linkedMemberId
        );
        console.log("[DEBUG] Edit mode - isLoadingMembers:", isLoadingMembers);
        console.log(
          "[DEBUG] Edit mode - shouldWaitForMembers:",
          shouldWaitForMembers
        );
        console.log("[DEBUG] Edit mode - unlinkedMembers:", unlinkedMembers);

        if (!shouldWaitForMembers) {
          // Transform dates from string to Date objects for editing
          const transformedData = {
            ...initialData,
            dateOfBirth: initialData.dateOfBirth
              ? new Date(initialData.dateOfBirth)
              : new Date(),
            dateOfDeath: initialData.dateOfDeath
              ? new Date(initialData.dateOfDeath)
              : null,
          };
          console.log("[DEBUG] Edit mode - transformedData:", transformedData);
          form.reset(transformedData);
        }
      }
    }
  }, [isOpen, mode, initialData, form, isLoadingMembers, unlinkedMembers]);

  const { isSubmitting } = form.formState;

  const handleSubmit = async (values: z.infer<typeof memberSchema>) => {
    if (isViewMode && !canEdit) {
      onClose();
      return;
    }

    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      console.error("Failed to save member:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, etc.)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      // Set uploading state to show overlay and disable interactions
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) throw new Error("Upload failed");

      // Update the form with the new image URL
      form.setValue("profileImage", result.url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image.");
    } finally {
      // Always ensure uploading state is reset
      setIsUploading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Prevent closing the dialog if an image is being uploaded
        if (isUploading) return;
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-lora text-2xl text-gray-800 text-center w-full">
              {mode === "add"
                ? "Add Family Member"
                : mode === "edit"
                  ? "Edit Family Member"
                  : "View Family Member"}
            </DialogTitle>
          <DialogDescription className="text-gray-600 md:text-sm text-xs text-center">
            Fill in the details of your family member. Required fields are
            marked with (*).
          </DialogDescription>
        </DialogHeader>
        
        {/* Loading overlay during image upload */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-50 cursor-not-allowed">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
            <span className="mt-4 text-lg font-semibold text-rose-500">Uploading image...</span>
            <p className="text-sm text-gray-500 mt-2">Please wait until the upload completes</p>
          </div>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 overflow-y-auto pr-2 flex-1"
          >
            {/* Essential Information */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="space-y-0 md:space-y-2">
                    <FormLabel className="text-gray-700">
                      First Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white border-gray-200"
                        disabled={isViewMode || !canEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="space-y-0 md:space-y-2">
                    <FormLabel className="text-gray-700">Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white border-gray-200"
                        disabled={isViewMode || !canEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-0 md:space-y-2">
                    <FormLabel className="text-gray-700">Gender *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isViewMode || !canEdit}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="space-y-0 md:space-y-2">
                    <FormLabel className="text-gray-700">
                      Date of Birth *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={
                          field.value ? format(field.value, "yyyy-MM-dd") : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                        max={format(new Date(), "yyyy-MM-dd")}
                        className="bg-white border-gray-200"
                        disabled={isViewMode || !canEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAlive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-0 md:space-y-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-gray-700">
                        Living Status *
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-rose-500"
                        disabled={isViewMode || !canEdit}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!form.watch("isAlive") && (
                <FormField
                  control={form.control}
                  name="dateOfDeath"
                  render={({ field }) => (
                    <FormItem className="space-y-0 md:space-y-2">
                      <FormLabel className="text-gray-700">
                        Date of Death *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value ? format(field.value, "yyyy-MM-dd") : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                          min={format(
                            form.watch("dateOfBirth") || new Date("1900-01-01"),
                            "yyyy-MM-dd"
                          )}
                          max={format(new Date(), "yyyy-MM-dd")}
                          className="bg-white border-gray-200"
                          disabled={isViewMode || !canEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="birthPlace"
                render={({ field }) => (
                  <FormItem className="space-y-0 md:space-y-2">
                    <FormLabel className="text-gray-700">
                      Birth Place *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white border-gray-200"
                        disabled={isViewMode || !canEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentPlace"
                render={({ field }) => (
                  <FormItem className="space-y-0 md:space-y-2">
                    <FormLabel className="text-gray-700">
                      {form.watch("isAlive")
                        ? "Current Address *"
                        : "Place of Death *"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white border-gray-200"
                        placeholder={
                          form.watch("isAlive")
                            ? "Enter current address"
                            : "Enter place of death"
                        }
                        disabled={isViewMode || !canEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Optional Information */}
            <div className="space-y-4">
              <div className="bg-amber-50/50 border border-amber-200/50 rounded-lg p-3 mb-4">
                <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-1 sm:text-base text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="sm:w-5 sm:h-5 w-4 h-4"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Help Preserve Family History
                </h3>
                <p className="sm:text-sm text-xs text-amber-700">
                  Adding detailed information helps future generations
                  understand their family history better. All optional fields
                  can be edited later by the family member themselves.
                </p>
              </div>

              <div className="relative">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm font-semibold leading-6">
                  <span className="bg-white px-4 text-rose-500">
                    Optional Details
                  </span>
                </div>
              </div>

              {/* Profile Image Upload with Progress Indicator */}
              <FormField
                control={form.control}
                name="profileImage"
                render={({ field }) => (
                  <FormItem className="space-y-0 md:space-y-2">
                    <div className="flex items-start justify-between mb-2">
                      <FormLabel className="text-gray-700">
                        Profile Picture
                      </FormLabel>
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          field.value
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {field.value ? "✓ Added" : "Recommended"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {field.value ? (
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-rose-100">
                          <img
                            src={field.value}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center border-4 border-rose-100">
                          <ImageIcon className="w-8 h-8 text-rose-300" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading || isViewMode || !canEdit}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full bg-white border-gray-200",
                            !field.value && "border-dashed border-2",
                            isUploading && "opacity-70"
                          )}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading || isViewMode || !canEdit}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : field.value ? (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Change Image
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              <span className="sm:text-base text-sm">Add a Photo</span>
                            </>
                          )}
                        </Button>
                       
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Biography with Character Counter and Suggestions */}
              <FormField
                control={form.control}
                name="biography"
                render={({ field }) => (
                      <FormItem className="space-y-0 md:space-y-2">
                    <div className="flex items-start justify-between mb-2">
                      <FormLabel className="text-gray-700">
                        Introduction
                      </FormLabel>
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          field.value && field.value.length > 100
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {field.value && field.value.length > 100
                          ? "✓ Detailed"
                          : "Recommended"}
                      </span>
                    </div>
                    <FormControl>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Share this person's short introduction..."
                          className="bg-white border-gray-200 resize-none h-[80px] focus-visible:ring-offset-0"
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          disabled={isViewMode || !canEdit}
                        />
                        <div className="text-xs text-gray-500">
                          <span>
                            {field.value ? field.value.length : 0} characters
                            {field.value &&
                              field.value.length < 100 &&
                              " (aim for 100+)"}
                          </span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="linkedMemberId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Link to Family Member
                  </FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                    value={field.value || "none"}
                    disabled={isLoadingMembers || isViewMode || !canEdit}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white border-gray-200">
                        <SelectValue placeholder="Select a family member to link" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <UserCheck2 className="w-4 h-4 text-gray-500" />
                          <span>Not linked to any member</span>
                        </div>
                      </SelectItem>
                      {unlinkedMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={member.imageUrl || undefined} />
                              <AvatarFallback>
                                {member.fullName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.fullName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="flex items-center text-gray-600 sm:text-base text-xs">
                    <i>Link this node to an existing family member who is not yet
                    linked to any other node</i>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center gap-2 mt-4 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isFormComplete ? "bg-green-500" : "bg-amber-500"
                  )}
                />
                <span className="sm:text-sm text-xs text-gray-600">
                  {isFormComplete
                    ? "All recommended fields completed"
                    : "Some recommended fields incomplete"}
                </span>
              </div>
              <div className="flex gap-2">
                {!isViewMode && canEdit && (
                  <Button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className={cn(
                      "bg-rose-500 hover:bg-rose-600 text-white",
                      (isSubmitting || isUploading) && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading Image...
                      </>
                    ) : (
                      "Save Member"
                    )}
                  </Button>
                )}
                {isViewMode && canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Implement logic to switch to edit mode
                    }}
                    className="bg-white border-gray-200"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
