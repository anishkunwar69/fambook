"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Family } from "@/types/family.types";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Home,
  Loader2,
  Pencil,
  PlusCircle,
  Search,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import PremiumUpgradeModal from "@/components/modals/PremiumUpgradeModal";
import { Progress } from "@/components/ui/progress";

// Add debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

type Tab = "approved" | "pending";

type FamilyWithStatus = Family & {
  userMembershipStatus: "APPROVED" | "PENDING" | "REJECTED" | null;
  pendingRequestsCount: number;
  isAdmin: boolean;
  createdById?: string;
  memberCount: number;
};

const FAMILIES_PER_PAGE = 6; // Added for pagination

const familyFormSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be 50 characters or less"),
  description: z
    .string()
    .max(200, "Description must be 200 characters or less")
    .optional(),
});

type FamilyFormData = z.infer<typeof familyFormSchema>;

// Skeleton Card Component
function FamilySkeletonCard() {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-gray-200 animate-pulse">
      {/* Skeleton Header */}
      <div className="mb-3 sm:mb-4">
        <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-5/6"></div>
      </div>

      {/* Skeleton Invite Code (approximating space) */}
      <div className="bg-gray-100 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6 border border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-20 sm:w-24 mb-1.5"></div>
            <div className="h-4 sm:h-5 bg-gray-200 rounded w-24 sm:w-32"></div>
          </div>
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16"></div>
        </div>
      </div>

      {/* Skeleton Action Button */}
      <div className="h-9 sm:h-10 bg-gray-200 rounded w-full"></div>
    </div>
  );
}

// Edit Family Modal Component
function EditFamilyModal({
  isOpen,
  onClose,
  familyToEdit,
  onConfirmEdit,
  isEditing,
}: {
  isOpen: boolean;
  onClose: () => void;
  familyToEdit: FamilyWithStatus | null;
  onConfirmEdit: (familyId: string, data: FamilyFormData) => void;
  isEditing: boolean;
}) {
  const [formData, setFormData] = useState<FamilyFormData>({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (isOpen && familyToEdit) {
      setFormData({
        name: familyToEdit.name,
        description: familyToEdit.description || "",
      });
      setErrors({}); // Clear errors when modal opens
    }
  }, [isOpen, familyToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const handleSubmit = () => {
    const validationResult = familyFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string | undefined> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (familyToEdit) {
      onConfirmEdit(familyToEdit.id, validationResult.data);
    }
  };

  if (!familyToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-blue-100/50">
        <DialogHeader>
          <DialogTitle className="text-blue-600 flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Edit Family Details
          </DialogTitle>
          <DialogDescription className="pt-2">
            Update the name and description for the family:{" "}
            <strong className="text-gray-800">{familyToEdit.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Family Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={cn(
                "border-gray-300 focus:border-blue-500 focus:ring-blue-500/50",
                errors.name && "border-red-500"
              )}
              maxLength={50}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <Label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={cn(
                "border-gray-300 focus:border-blue-500 focus:ring-blue-500/50",
                errors.description && "border-red-500"
              )}
              rows={3}
              maxLength={200}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isEditing}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isEditing}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isEditing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Modal Component
function DeleteFamilyModal({
  isOpen,
  onClose,
  familyToDelete,
  onConfirmDelete,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  familyToDelete: { id: string; name: string } | null;
  onConfirmDelete: (familyId: string) => void;
  isDeleting: boolean;
}) {
  const [confirmationName, setConfirmationName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setConfirmationName("");
    }
  }, [isOpen, familyToDelete]);

  const isMatch = familyToDelete
    ? confirmationName === familyToDelete.name
    : false;

  if (!familyToDelete) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-red-100/50">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2 sm:text-lg text-base">
            <AlertTriangle className="sm:w-5 sm:h-5 w-4 h-4" />
            Delete Family Confirmation
          </DialogTitle>
          <DialogDescription className="pt-2 max-sm:text-xs">
            Are you absolutely sure you want to delete the family "
            <strong className="text-gray-800">{familyToDelete.name}</strong>"?
            This action is permanent and cannot be undone. All associated data
            (members, posts, albums, events) will be lost.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 sm:space-y-2 space-y-0">
          <Label
            htmlFor="confirmationName"
            className="sm:text-sm text-xs font-medium text-gray-700"
          >
            To confirm deletion, please type the family name:{" "}
            <strong className="text-gray-800">{familyToDelete.name}</strong>
          </Label>
          <Input
            id="confirmationName"
            value={confirmationName}
            onChange={(e) => setConfirmationName(e.target.value)}
            placeholder={familyToDelete.name}
            className="border-gray-300 focus:border-red-500 focus:ring-red-500/50"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirmDelete(familyToDelete.id)}
            disabled={!isMatch || isDeleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
              </>
            ) : (
              "Delete Family"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Custom Progress Bar with dynamic color based on percentage
function DynamicColorProgress({ value, className }: { value: number, className?: string }) {
  // Determine color based on percentage
  const getColor = () => {
    if (value <= 50) {
      return "bg-green-500"; // Green for < 50%
    } else if (value <= 80) {
      return "bg-amber-500"; // Yellow for 50-80%
    } else {
      return "bg-rose-500"; // Red for > 80%
    }
  };

  // Use a different background when at limit (100%)
  const getBgColor = () => {
    return value >= 100 ? "bg-rose-100" : "bg-gray-100";
  };

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full", getBgColor(), className)}>
      <div
        className={cn("h-full absolute top-0 left-0 transition-all duration-300", getColor())}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export default function FamiliesPage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("approved");
  const [familyToDelete, setFamilyToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [familyToEdit, setFamilyToEdit] = useState<FamilyWithStatus | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1); // Added for pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const queryClient = useQueryClient();
  const { user: clerkUser, isSignedIn } = useUser();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [membersUpgradeModalOpen, setMembersUpgradeModalOpen] = useState(false);

  // Debounced search handler
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
      setCurrentPage(1); // Reset page when search changes
    }, 500),
    []
  );

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  const {
    data: families,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<FamilyWithStatus[]>({
    queryKey: ["families"],
    queryFn: async () => {
      const response = await fetch("/api/families");
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }

      // Debug log to check if the memberCount is being returned
      console.log("API response data:", result.data);
      
      // Ensure memberCount is properly set, defaulting to 0 if not provided
      const familiesWithMemberCount = (result.data || []).map((family: FamilyWithStatus) => ({
        ...family,
        memberCount: family.memberCount || 0
      }));

      return familiesWithMemberCount;
    },
    enabled: isSignedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Force refetch when component mounts to ensure fresh data
  useEffect(() => {
    if (isSignedIn) {
      refetch();
    }
  }, [isSignedIn, refetch]);

  // Edit Family Mutation
  const editFamilyMutation = useMutation({
    mutationFn: async ({
      familyId,
      data,
    }: {
      familyId: string;
      data: FamilyFormData;
    }) => {
      const response = await fetch(`/api/families/${familyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorResult = await response
          .json()
          .catch(() => ({ message: "Failed to update family" }));
        throw new Error("Failed to update family");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Family details updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["families"] });
      setFamilyToEdit(null); // Close the modal
    },
    onError: (err: Error) => {
      toast.error("Could not update family details.");
    },
  });

  // Delete Family Mutation
  const deleteFamilyMutation = useMutation({
    mutationFn: async (familyId: string) => {
      const response = await fetch(`/api/families/${familyId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorResult = await response
          .json()
          .catch(() => ({ message: "Failed to delete family" }));
        throw new Error("Failed to delete family");
      }
      if (response.status === 204) {
        return { success: true };
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Family deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["families"] });
      setFamilyToDelete(null);
    },
    onError: (err: Error) => {
      toast.error("Could not delete family");
    },
  });

  const copyToClipboard = async (token: string) => {
    await navigator.clipboard.writeText(token);
    setCopiedToken(token);
    toast.success("Invite code copied!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const renderFamilyCard = (family: FamilyWithStatus, index: number) => {
    const isPending = family.userMembershipStatus === "PENDING";
    const hasJoinRequests = family.isAdmin && family.pendingRequestsCount > 0;
    
    // Use the actual member count from the API with fallback to ensure it's always defined
    const memberCount = typeof family.memberCount === 'number' ? family.memberCount : 0;
    const memberLimit =15; // Free plan limit - 15 members per family
    
    // In a full implementation, you would:
    // 1. Check if the user has a premium subscription
    // 2. Set the memberLimit to Infinity for premium users
    // 3. Only show the upgrade prompts for non-premium users
    // For this example, we're assuming all users are on the free plan
    
    const isAtLimit = memberCount >= memberLimit;
    const percentFilled = Math.min((memberCount / memberLimit) * 100, 100); // Cap at 100%

    // More detailed debug log
    console.log(`Family ${family.name} (${family.id}) details:`, {
      familyObject: family,
      isAdmin: family.isAdmin,
      createdById: family.createdById,
      pendingRequestsCount: family.pendingRequestsCount,
      memberCount: memberCount,
      rawMemberCount: family.memberCount,
      isAtLimit,
      percentFilled,
    });

    return (
      <motion.div
        key={family.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          "bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border transition-all group relative",
          isPending
            ? "border-amber-200 hover:border-amber-300"
            : hasJoinRequests
              ? "border-rose-200 hover:border-rose-300 shadow-md"
              : "border-rose-100/50 hover:border-rose-200"
        )}
      >
        {/* Member Limit Indicator */}
        {!isPending && (
          <div className="mb-2 sm:mt-[22px] mt-8">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                <span className="text-xs sm:text-sm text-gray-600 font-medium">
                  Family Members
                </span>
              </div>
              <span className="text-xs font-medium text-gray-500">
                {memberCount !== undefined ? memberCount : "?"}/{memberLimit}
              </span>
            </div>
            
            <div className="relative">
              <DynamicColorProgress 
                value={percentFilled} 
                className="h-1.5 sm:h-2"
              />
            </div>
            
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Members limit.
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMembersUpgradeModalOpen(true);
                }}
                className="text-rose-500 hover:text-rose-600 font-medium sm:text-sm text-xs"
              >
                Upgrade
              </button> for unlimited
            </p>
          </div>
        )}

        {/* Pending Requests Badge - Positioned at top of card */}
        {hasJoinRequests && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-2 sm:-top-3 left-3 sm:left-4 z-10 cursor-pointer"
            onClick={() => {
              router.push(`/families/${family.id}/requests`);
            }}
          >
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-2 sm:px-3 py-1 rounded-full shadow-lg border-2 border-white hover:bg-rose-600 hover:border-rose-700">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-medium">
                  {family.pendingRequestsCount} pending
                  <span className="hidden sm:inline">
                    {" "}
                    request{family.pendingRequestsCount !== 1 ? "s" : ""}
                  </span>
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {family.isAdmin && !isPending && (
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-blue-500 hover:bg-blue-50/50 h-8 w-8 sm:h-auto sm:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                setFamilyToEdit(family); // Open edit modal
              }}
              title="Edit Family"
            >
              <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-500 hover:bg-red-50/50 h-8 w-8 sm:h-auto sm:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                setFamilyToDelete({ id: family.id, name: family.name });
              }}
              title="Delete Family"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        )}

        {/* Status Badge */}
        {isPending && (
          <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Pending Approval</span>
            <span className="sm:hidden">Pending</span>
          </div>
        )}

        {/* Family Card Header */}
        <div className="mb-3 sm:mb-4">
          <h3 className="font-lora text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1 group-hover:text-rose-600 transition-colors line-clamp-1">
            {family.name}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
            {family.description || "No description provided"}
          </p>
        </div>

        {/* Invite Code Section */}
        {!isPending && (
          <>
            {isAtLimit ? (
              <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6 border border-rose-100">
                <div className="flex items-start gap-2">
                  <Crown className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-700 font-medium">
                      Members limit reached
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 mb-1.5">
                      Upgrade to Premium for unlimited members and more features
                    </p>
                    <Button
                      size="sm"
                      className="w-full h-7 sm:h-8 text-xs sm:text-sm bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMembersUpgradeModalOpen(true);
                      }}
                    >
                      <Crown className="w-3 h-3 mr-1.5" />
                      Upgrade to Premium
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50/50 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6 border border-rose-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-rose-600 mb-1 flex items-center gap-1">
                      <Share2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Family Invite Code</span>
                      <span className="sm:hidden">Code</span>
                    </p>
                    <code className="text-xs sm:text-sm font-mono text-gray-800 break-all">
                      {family.joinToken}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 hover:bg-rose-100 h-8 px-2 sm:h-auto sm:px-3"
                    onClick={() => copyToClipboard(family.joinToken)}
                  >
                    {copiedToken === family.joinToken ? (
                      <>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 sm:mr-1.5" />
                        <span className="text-green-600 text-xs hidden sm:inline">
                          Copied!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
                        <span className="text-xs hidden sm:inline">Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {isPending ? (
            <Button
              disabled
              className="w-full bg-amber-100 text-amber-700 cursor-not-allowed h-9 sm:h-10 text-sm"
            >
              <Clock className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Awaiting Approval</span>
              <span className="sm:hidden">Pending</span>
            </Button>
          ) : (
            <Link href={`/families/${family.id}`} className="block">
              <Button className="w-full bg-rose-500 hover:bg-rose-600 h-9 sm:h-10 text-sm">
                View Family
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
    );
  };

  const renderTabs = () => {
    const approvedCount =
      families?.filter((f) => f.userMembershipStatus === "APPROVED").length ??
      0;
    const pendingCount =
      families?.filter((f) => f.userMembershipStatus === "PENDING").length ?? 0;

    return (
      <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("approved");
            setCurrentPage(1); // Reset page on tab change
          }}
          className={cn(
            "px-3 sm:px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap",
            activeTab === "approved"
              ? "text-rose-600 border-b-2 border-rose-500"
              : "text-gray-600 hover:text-rose-600"
          )}
        >
          <span className="hidden sm:inline">My Families</span>
          <span className="sm:hidden">Families</span>
          {approvedCount > 0 && (
            <span className="ml-1 sm:ml-2 bg-rose-100 text-rose-600 px-1.5 sm:px-2 py-0.5 rounded-full text-xs">
              {approvedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("pending");
            setCurrentPage(1); // Reset page on tab change
          }}
          className={cn(
            "px-3 sm:px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap",
            activeTab === "pending"
              ? "text-amber-600 border-b-2 border-amber-500"
              : "text-gray-600 hover:text-amber-600"
          )}
        >
          Pending
          {pendingCount > 0 && (
            <span className="ml-1 sm:ml-2 bg-amber-100 text-amber-600 px-1.5 sm:px-2 py-0.5 rounded-full text-xs">
              {pendingCount}
            </span>
          )}
        </button>
      </div>
    );
  };

  const filteredFamilies = (families || []).filter((family) => {
    const matchesSearch = debouncedSearch
      ? family.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true;
    const matchesTab =
      family.userMembershipStatus ===
      (activeTab === "approved" ? "APPROVED" : "PENDING");
    return matchesSearch && matchesTab;
  });

  // Paginate families - Added for pagination
  const totalPages = Math.ceil(filteredFamilies.length / FAMILIES_PER_PAGE);
  const paginatedFamilies = filteredFamilies.slice(
    (currentPage - 1) * FAMILIES_PER_PAGE,
    currentPage * FAMILIES_PER_PAGE
  );

  // Determine if user should see upgrade prompt (has more than 1 approved family)
  const approvedFamiliesCount = families?.filter(
    (f) => f.userMembershipStatus === "APPROVED"
  ).length ?? 0;
  const shouldShowUpgradePrompt = approvedFamiliesCount >= 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8 max-lg:pb-20">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap mt-[8px]"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1 shrink-0"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <Link
          href="/dashboard"
          className="hover:text-rose-500 transition-colors shrink-0"
        >
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <span className="text-rose-500 font-medium shrink-0">My Families</span>
      </motion.div>

      {/* Header Section - Updated to match feed page style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-rose-100/50 mb-6 md:mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="text-center md:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-lora font-bold text-gray-800 mb-2">
              My Families ❤️
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
              Manage your family spaces and connections
            </p>
          </div>
          {shouldShowUpgradePrompt ? (
            <Button 
              onClick={() => setShowUpgradeModal(true)}
              className="bg-rose-500 hover:bg-rose-600 flex items-center justify-center gap-2 w-full md:w-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create More Families</span>
            </Button>
          ) : (
            <Link href="/families/create" className="w-full md:w-auto">
              <Button className="bg-rose-500 hover:bg-rose-600 flex items-center justify-center gap-2 w-full md:w-auto">
                <PlusCircle className="w-4 h-4" />
                <span>Create Family</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Search Section */}
        {/* Only show search when there are families */}
        {families && families.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search families by name..."
                value={search}
                onChange={handleSearchChange}
                className="pl-10 bg-white w-full h-10 md:h-auto"
              />
            </div>
          </div>
        )}
      </motion.div>

     
      {/* Tabs Navigation */}
      {families && families.length > 0 && renderTabs()}

      {/* Empty state - Updated to show upgrade message when needed */}
      {!isLoading && !isError && filteredFamilies.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 sm:p-12 text-center border border-rose-100/50"
        >
          <div className="bg-rose-50 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-lora font-bold text-gray-800 mb-2">
            {search
              ? "No Families Found"
              : activeTab === "approved"
                ? "No Families Yet"
                : "No Pending Requests"}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-4 sm:mb-6 text-xs sm:text-base">
            {search
              ? `No families found matching "${search}". Try a different search term.`
              : activeTab === "approved"
                ? "Start your journey by creating a new family space or joining an existing one."
                : "You don't have any pending join requests at the moment."}
          </p>
          {!search && activeTab === "approved" && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {shouldShowUpgradePrompt ? (
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 items-center">
                  <Button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-rose-500 hover:bg-rose-600 w-full sm:w-auto"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create More Family
                  </Button>
                  <Link href="/families/join" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Users className="w-4 h-4 mr-2" />
                      Join Family
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 items-center">
                  <Link href="/families/create" className="w-full sm:w-auto">
                    <Button className="bg-rose-500 hover:bg-rose-600 w-full sm:w-auto">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Family
                    </Button>
                  </Link>
                  <Link href="/families/join" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Users className="w-4 h-4 mr-2" />
                      Join Family
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureContext="families" 
      />

      {/* Members Limit Upgrade Modal */}
      <PremiumUpgradeModal 
        isOpen={membersUpgradeModalOpen} 
        onClose={() => setMembersUpgradeModalOpen(false)} 
        featureContext="members" 
      />

      {/* Families Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, index) => (
            <FamilySkeletonCard key={index} />
          ))}
        </div>
      ) : isError ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50/50 backdrop-blur-md rounded-2xl p-6 sm:p-12 text-center border border-red-100/50 text-red-700"
        >
          <div className="bg-red-100 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-lora font-bold text-red-800 mb-2">
            Failed to Load Families
          </h3>
          <p className="text-red-600 max-w-md mx-auto mb-4 sm:mb-6 text-sm sm:text-base">
            {error instanceof Error
              ? error.message
              : "An unknown error occurred."}
          </p>
          <Button
            onClick={() => refetch()}
            variant="destructive"
            className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
          >
            Retry
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
          {paginatedFamilies.map((family, index) =>
            renderFamilyCard(family, index)
          )}
        </div>
      )}

      {/* Pagination Controls - Added for pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-6 sm:mt-8"
        >
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 text-sm ${
                    pageNum === currentPage
                      ? "bg-rose-500 hover:bg-rose-600"
                      : ""
                  }`}
                >
                  {pageNum}
                </Button>
              )
            )}
          </div>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            Next
          </Button>
        </motion.div>
      )}

      {/* Render Delete Family Modal */}
      <DeleteFamilyModal
        isOpen={!!familyToDelete}
        onClose={() => setFamilyToDelete(null)}
        familyToDelete={familyToDelete}
        onConfirmDelete={(familyId) => deleteFamilyMutation.mutate(familyId)}
        isDeleting={deleteFamilyMutation.isPending}
      />

      {/* Render Edit Family Modal */}
      <EditFamilyModal
        isOpen={!!familyToEdit}
        onClose={() => setFamilyToEdit(null)}
        familyToEdit={familyToEdit}
        onConfirmEdit={(familyId, data) =>
          editFamilyMutation.mutate({ familyId, data })
        }
        isEditing={editFamilyMutation.isPending}
      />
    </div>
  );
}
