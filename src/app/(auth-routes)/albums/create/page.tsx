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
import { Check, ChevronRight, Crown, Home, Loader2, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import PremiumUpgradeModal from "@/components/modals/PremiumUpgradeModal";

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
  mediaLimit: z.number().min(1).max(15).default(15),
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
  const [upgradePremiumModalOpen, setUpgradePremiumModalOpen] = useState(false);
  const [checkingAlbumLimit, setCheckingAlbumLimit] = useState(true);
  const [limitReached, setLimitReached] = useState(false);

  const { data: families, isLoading: loadingFamilies } = useQuery<Family[]>({
    queryKey: ["userFamiliesForAlbumCreation"],
    queryFn: async () => {
      const response = await fetch("/api/families");
      const result = await response.json();
      if (!result.success) {
        throw new Error("Failed to fetch families");
      }
      return result.data.filter(
        (family: any) => family.userMembershipStatus === "APPROVED"
      );
    },
  });

  // Check if any family has reached the album limit
  useEffect(() => {
    const checkAlbumLimit = async () => {
      if (!families || families.length === 0) return;
      
      setCheckingAlbumLimit(true);
      
      try {
        // Check each family's album limit
        for (const family of families) {
          const response = await fetch(`/api/families/${family.id}/stats`);
          const result = await response.json();
          
          if (result.success && 
              result.data.albumStats.currentMonthAlbums >= result.data.albumStats.albumLimit) {
            // Limit reached for at least one family
            setLimitReached(true);
            setUpgradePremiumModalOpen(true);
            break;
          }
        }
      } catch (error) {
        console.error("Error checking album limit:", error);
      } finally {
        setCheckingAlbumLimit(false);
      }
    };
    
    if (families) {
      checkAlbumLimit();
    }
  }, [families]);

  const form = useForm<CreateAlbumInput>({
    resolver: zodResolver(createAlbumSchema),
    defaultValues: {
      name: "",
      description: "",
      familyIds: [],
      mediaLimit: 15,
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
        if (response.status === 403 && result.message.includes("Monthly album limit")) {
          throw new Error(`${result.message} Please upgrade to Premium for unlimited albums.`);
        }
        throw new Error("Failed to create album(s)");
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
      if (error.message.includes("Monthly album limit")) {
        toast.error(error.message, {
          duration: 5000,
          icon: <Crown className="h-5 w-5 text-amber-500" />,
        });
        setUpgradePremiumModalOpen(true);
      } else {
      toast.error("Failed to create album");
      }
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

  // Show loading state while checking album limit
  if (loadingFamilies || checkingAlbumLimit) {
    return (
      <div className="min-h-[90vh] lg:min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          <p className="text-gray-600">Checking album limits...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PremiumUpgradeModal 
        isOpen={upgradePremiumModalOpen} 
        onClose={() => {
          if (limitReached) {
            router.back();
          } else {
            setUpgradePremiumModalOpen(false);
          }
        }}
        featureContext="albums"
        showCloseButton={!limitReached}
        customActionLabel={limitReached ? "Go Back" : undefined}
      />

    <div className="lg:min-h-[97vh] min-h-[92vh] bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 md:mb-6 sm:mb-4 mt-[8px]"
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

        {!limitReached && (
          <div className="flex-1 flex items-center justify-center max-xs:mt-8 max-xs:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-rose-100/50 w-full max-w-2xl shadow-xl"
        >
          <h1 className="sm:text-3xl text-2xl font-lora font-bold text-gray-800 sm:mb-8 mb-6 text-center">
            Create New Album
          </h1>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="sm:space-y-6 space-y-3"
            >
              <FormField
                control={form.control}
                name="familyIds"
                render={({ field }) => (
                  <FormItem className="space-y-0 sm:space-y-2">
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
                            {families && families.length > 0 ? (
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
                      Choose family
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-0 sm:space-y-2">
                    <FormLabel>
                      Album Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter album name" {...field}/>
                    </FormControl>
                    <FormDescription>
                      Give a meaningful name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-0 sm:space-y-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your album (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add description.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

                  {/* Information about media limit */}
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
                    <p className="sm:text-sm text-xs text-gray-700">
                      <span className="font-medium">Note:</span> Each album can contain up to 15 media items (images up to 10MB, max 1 video up to 100MB).
                    </p>
                  </div>

              <div className="flex justify-end gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      type="button" 
                      disabled={isPending}
                      onClick={() => router.back()}
                    >
                    Cancel
                  </Button>
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
        )}
    </div>
    </>
  );
}
