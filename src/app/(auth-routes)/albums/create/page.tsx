"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, ChevronRight, Home, Loader2, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

const createAlbumSchema = z.object({
  name: z
    .string()
    .min(2, "Album name must be at least 2 characters")
    .max(50, "Album name cannot exceed 50 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  familyIds: z.array(z.string()).min(1, "Please select at least one family"),
  eventId: z.string().optional(),
  mediaLimit: z.number().min(1).max(100).default(100),
});

type CreateAlbumInput = z.infer<typeof createAlbumSchema>;

type Family = {
  id: string;
  name: string;
  userMembershipStatus?: string;
};

export default function CreateAlbumPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<Set<string>>(
    new Set()
  );

  const { data: families, isLoading: loadingFamilies } = useQuery<Family[]>({
    queryKey: ["userFamiliesForAlbumCreation"],
    queryFn: async () => {
      const response = await fetch("/api/families");
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch families");
      }
      return result.data.filter(
        (family: any) => family.userMembershipStatus === "APPROVED"
      );
    },
  });

  const form = useForm<CreateAlbumInput>({
    resolver: zodResolver(createAlbumSchema),
    defaultValues: {
      name: "",
      description: "",
      familyIds: [],
      mediaLimit: 100,
      eventId: undefined,
    },
  });

  useEffect(() => {
    form.setValue("familyIds", Array.from(selectedFamilyIds));
    if (selectedFamilyIds.size > 0 && form.formState.errors.familyIds) {
      form.clearErrors("familyIds");
    }
  }, [selectedFamilyIds, form]);

  const { mutate: createAlbum, isPending } = useMutation({
    mutationFn: async (data: CreateAlbumInput) => {
      const response = await fetch("/api/albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to create album(s)");
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success(
        `${Array.isArray(data) ? data.length : 1} album(s) created successfully!`
      );
      router.push(`/albums`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "An error occurred.");
    },
  });

  const onSubmit = (data: CreateAlbumInput) => {
    if (selectedFamilyIds.size === 0) {
      form.setError("familyIds", {
        type: "manual",
        message: "Please select at least one family",
      });
      return;
    }
    createAlbum(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-8 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-6"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/albums" className="hover:text-rose-500 transition-colors">
          Albums
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-rose-500 font-medium">Create Album</span>
      </motion.div>

      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-rose-100/50 w-full max-w-2xl shadow-xl"
        >
          <h1 className="text-3xl font-lora font-bold text-gray-800 mb-8 text-center">
            Create New Album
          </h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="familyIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Family</FormLabel>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal"
                          >
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              {selectedFamilyIds.size === 0
                                ? "Select families..."
                                : selectedFamilyIds.size ===
                                      (families?.length || 0) &&
                                    (families?.length || 0) > 0
                                  ? "All Approved Families"
                                  : `${selectedFamilyIds.size} ${selectedFamilyIds.size === 1 ? "Family" : "Families"} Selected`}
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          </Button>
                        </FormControl>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--trigger-width] max-h-60 overflow-y-auto p-2">
                        {loadingFamilies ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        ) : families && families.length > 0 ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (
                                  selectedFamilyIds.size === families.length
                                ) {
                                  setSelectedFamilyIds(new Set());
                                } else {
                                  setSelectedFamilyIds(
                                    new Set(families.map((f) => f.id))
                                  );
                                }
                              }}
                              className="w-full justify-start mb-1 text-sm"
                            >
                              {selectedFamilyIds.size === families.length ? (
                                <>
                                  <X className="w-4 h-4 mr-2" /> Clear All
                                </>
                              ) : (
                                <>
                                  <Users className="w-4 h-4 mr-2" /> Select All
                                  ({families.length})
                                </>
                              )}
                            </Button>
                            <div className="h-px bg-gray-100 -mx-2 my-1" />
                            {families.map((family) => (
                              <Button
                                key={family.id}
                                type="button"
                                variant={
                                  selectedFamilyIds.has(family.id)
                                    ? "secondary"
                                    : "ghost"
                                }
                                size="sm"
                                onClick={() => {
                                  setSelectedFamilyIds((prev) => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(family.id)) {
                                      newSet.delete(family.id);
                                    } else {
                                      newSet.add(family.id);
                                    }
                                    return newSet;
                                  });
                                }}
                                className="w-full justify-start text-sm font-normal"
                              >
                                {selectedFamilyIds.has(family.id) ? (
                                  <div className="w-4 h-4 mr-2 rounded-sm bg-rose-500 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 mr-2 rounded-sm border border-gray-300" />
                                )}
                                {family.name}
                              </Button>
                            ))}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500 p-2 text-center">
                            No approved families found.
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <FormDescription>
                      Choose which family or families this album belongs to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Album Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter album name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give your album a meaningful name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your album (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add some details about this album.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mediaLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Media Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 1)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of photos and videos (1-100).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Link href="/albums">
                  <Button variant="outline" type="button" disabled={isPending}>
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-rose-500 hover:bg-rose-600"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Creating...
                    </>
                  ) : (
                    "Create Album"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
