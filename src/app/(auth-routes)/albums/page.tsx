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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronRight,
  Check,
  Clock,
  Crown,
  Home,
  Image as ImageIcon,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import PremiumUpgradeModal from "@/components/modals/PremiumUpgradeModal";

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

type Album = {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  familyId: string;
  mediaCount: number;
  createdAt: string;
  family: {
    name: string;
  };
  event?: {
    title: string;
    type: string;
  };
  isAdmin?: boolean;
};

type FilterType = "ALL" | "NORMAL" | "EVENTS";
type SortType = "NEWEST" | "OLDEST" | "MOST_PHOTOS";

const ALBUMS_PER_PAGE = 6;

// First, fix the family type
type Family = {
  id: string;
  name: string;
  userMembershipStatus?: "APPROVED" | "PENDING" | null;
};

// Skeleton Card Component for Albums
function AlbumSkeletonCard() {
  return (
    <div className="group relative bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] relative">
        <div className="w-full h-full bg-gray-200"></div>
      </div>
      <div className="p-3 sm:p-4">
        <div className="h-4 sm:h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="flex items-center justify-between text-sm">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}

// Edit Album Modal Component
const editAlbumFormSchema = z.object({
  name: z
    .string()
    .min(2, "Album name must be at least 2 characters")
    .max(50, "Album name cannot exceed 50 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});
type EditAlbumFormData = z.infer<typeof editAlbumFormSchema>;

function EditAlbumModal({
  isOpen,
  onClose,
  albumToEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  albumToEdit: Album | null;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EditAlbumFormData>({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (albumToEdit) {
      setFormData({
        name: albumToEdit.name,
        description: albumToEdit.description || "",
      });
      setErrors({});
    } else {
      // Reset form if albumToEdit is null (e.g. modal closed and reopened without a selection)
      setFormData({ name: "", description: "" });
      setErrors({});
    }
  }, [albumToEdit, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const editAlbumMutation = useMutation({
    mutationFn: async (data: EditAlbumFormData) => {
      if (!albumToEdit) throw new Error("No album selected for editing.");
      const response = await fetch(`/api/albums/${albumToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to update album");
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Album updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error("Could not update album.");
    },
  });

  const handleSubmit = () => {
    const validationResult = editAlbumFormSchema.safeParse(formData);
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
    editAlbumMutation.mutate(validationResult.data);
  };

  if (!isOpen || !albumToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-blue-100/50">
        <DialogHeader>
          <DialogTitle className="text-blue-600 flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Edit Album Details
          </DialogTitle>
          <DialogDescription className="pt-2">
            Update the name and description for the album:{" "}
            <strong className="text-gray-800">{albumToEdit.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label
              htmlFor="name-edit"
              className="text-sm font-medium text-gray-700"
            >
              Album Name
            </Label>
            <Input
              id="name-edit"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "border-red-500" : "border-gray-300"}
              maxLength={50}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <Label
              htmlFor="description-edit"
              className="text-sm font-medium text-gray-700"
            >
              Description (Optional)
            </Label>
            <Textarea
              id="description-edit"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              className={
                errors.description ? "border-red-500" : "border-gray-300"
              }
              rows={3}
              maxLength={500}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={editAlbumMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={editAlbumMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {editAlbumMutation.isPending ? (
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

// Delete Album Confirmation Modal Component
function DeleteAlbumConfirmationModal({
  isOpen,
  onClose,
  albumToDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  albumToDelete: { id: string; name: string } | null;
}) {
  const queryClient = useQueryClient();
  const [confirmationName, setConfirmationName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setConfirmationName("");
    }
  }, [isOpen, albumToDelete]);

  const deleteAlbumMutation = useMutation({
    mutationFn: async (albumId: string) => {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!result.success && response.status !== 200) {
        throw new Error("Failed to delete album");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Album deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      queryClient.invalidateQueries({ queryKey: ["albumLimit"] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error("Could not delete album.");
    },
  });

  const handleConfirmDelete = () => {
    if (albumToDelete && confirmationName === albumToDelete.name) {
      deleteAlbumMutation.mutate(albumToDelete.id);
    }
  };

  if (!isOpen || !albumToDelete) return null;

  const isMatch = confirmationName === albumToDelete.name;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-red-100/50">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Delete Album Confirmation
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to delete the album "
            <strong className="text-gray-800">{albumToDelete.name}</strong>"?
            This action is permanent and cannot be undone. All associated media
            will also be deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label
            htmlFor="confirmationName-album"
            className="text-sm font-medium text-gray-700"
          >
            To confirm deletion, please type the album name:{" "}
            <strong className="text-gray-800">{albumToDelete.name}</strong>
          </Label>
          <Input
            id="confirmationName-album"
            value={confirmationName}
            onChange={(e) => setConfirmationName(e.target.value)}
            placeholder={albumToDelete.name}
            className="border-gray-300 focus:border-red-500 focus:ring-red-500/50"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteAlbumMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={!isMatch || deleteAlbumMutation.isPending}
            className="bg-red-500 hover:bg-red-600"
          >
            {deleteAlbumMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
              </>
            ) : (
              "Delete Album"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add the AlbumLimitProgressBar component
function AlbumLimitProgressBar({
  currentAlbums,
  albumLimit,
  familyName = "your family",
  onUpgradeClick,
  resetDate,
}: {
  currentAlbums: number;
  albumLimit: number;
  familyName?: string;
  onUpgradeClick: () => void;
  resetDate?: string;
}) {
  // Calculate the usage percentage
  const percentage = Math.min((currentAlbums / albumLimit) * 100, 100);

  // Determine color and message based on percentage
  const getColor = () => {
    if (percentage <= 60) {
      return "bg-green-500"; // Green for <= 60%
    } else if (percentage <= 90) {
      return "bg-amber-500"; // Yellow for 60-90%
    } else {
      return "bg-rose-500"; // Red for > 90%
    }
  };

  // Background color - lighter version of the progress color
  const getBgColor = () => {
    if (percentage <= 60) {
      return "bg-green-100";
    } else if (percentage <= 90) {
      return "bg-amber-100";
    } else {
      return "bg-rose-100";
    }
  };

  // Get appropriate message based on percentage
  const getMessage = () => {
    if (percentage <= 60) {
      return "You're all set! Keep creating albums for your family memories.";
    } else if (percentage <= 90) {
      return "You're almost at your monthly album limit. Plan your albums wisely.";
    } else if (percentage < 100) {
      return "You're about to hit your monthly limit. Upgrade to keep creating albums without interruptions.";
    } else {
      return "You've reached your monthly album limit. Upgrade to Premium to keep organizing memories.";
    }
  };

  

  // Determine if we should show an upgrade button
  const showUpgradeButton = percentage > 60;

  // Albums remaining count
  const albumsRemaining = Math.max(0, albumLimit - currentAlbums);

  // Calculate days until reset if resetDate is provided
  const getDaysUntilReset = () => {
    if (!resetDate) return null;
    
    const today = new Date();
    const reset = new Date(resetDate);
    const diffTime = reset.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : null;
  };
  
  const daysUntilReset = getDaysUntilReset();

  return (
    <div className={cn("rounded-lg p-3 mb-4 border mt-9", getBgColor())}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="sm:text-sm text-xs font-medium">
              Monthly Album Limit: {currentAlbums}/{albumLimit}
            </p>
            <span className="text-xs">
              {albumsRemaining} {albumsRemaining === 1 ? "album" : "albums"}{" "}
              remaining
            </span>
          </div>

          <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/50 mb-2">
            <div
              className={cn(
                "h-full absolute top-0 left-0 transition-all duration-300",
                getColor()
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="text-xs text-gray-700 mb-2">{getMessage()}</p>
          
          {/* Show reset countdown when limit is reached */}
          {percentage >= 100 && daysUntilReset !== null && (
            <p className="text-xs font-medium text-rose-700 mb-2">
              Next albums reset in {daysUntilReset} {daysUntilReset === 1 ? "day" : "days"}
            </p>
          )}

          {showUpgradeButton && (
            <Button
              size="sm"
              onClick={onUpgradeClick}
              className={cn(
                "h-7 text-xs w-full md:w-auto",
                percentage > 90
                  ? "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
                  : "bg-white text-amber-600 border border-amber-200 hover:bg-amber-50"
              )}
            >
              <Crown className="w-3 h-3 mr-1.5" />
              Upgrade to Premium
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Add a MediaLimitIndicator component
function MediaLimitIndicator({ current, limit = 15 }: { current: number; limit?: number }) {
  // Calculate percentage of media limit used
  const percentage = (current / limit) * 100;
  
  // Determine color based on percentage
  const getColor = () => {
    if (percentage <= 50) {
      return "bg-green-500"; // Green for <= 50%
    } else if (percentage <= 85) {
      return "bg-amber-500"; // Amber for 50-85%
    } else {
      return "bg-rose-500"; // Red for > 85%
    }
  };
  
  // Determine text color based on percentage
  const getTextColor = () => {
    if (percentage <= 50) {
      return "text-green-700"; // Green for <= 50%
    } else if (percentage <= 85) {
      return "text-amber-700"; // Amber for 50-85%
    } else {
      return "text-rose-700"; // Red for > 85%
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs ${getTextColor()} font-medium`}>
          Media: {current}/{limit}
        </span>
        <span className="text-xs text-gray-500">
          {limit - current} remaining
        </span>
      </div>
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function AlbumsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [sort, setSort] = useState<SortType>("NEWEST");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [albumLimitModalOpen, setAlbumLimitModalOpen] = useState(false);

  // State for Edit Album Modal
  const [isEditAlbumModalOpen, setIsEditAlbumModalOpen] = useState(false);
  const [albumToEdit, setAlbumToEdit] = useState<Album | null>(null);

  // State for Delete Album Modal
  const [isDeleteAlbumConfirmModalOpen, setIsDeleteAlbumConfirmModalOpen] =
    useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Debounced search handler
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500),
    []
  );

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  // Fetch albums
  const { data: albums, isLoading } = useQuery<Album[]>({
    queryKey: ["albums"],
    queryFn: async () => {
      const response = await fetch("/api/albums");
      const result = await response.json();
      if (!result.success) {
        throw new Error("Something went wrong!");
      }
      return result.data;
    },
  });

  // Fetch user's families
  const { data: families } = useQuery({
    queryKey: ["families"],
    queryFn: async () => {
      const response = await fetch("/api/families");
      const result = await response.json();
      if (!result.success) {
        throw new Error("Something went wrong!");
      }
      return result.data;
    },
  });

  // Check if user has joined any families
  const hasJoinedFamilies = families && families.filter((family: any) => family.userMembershipStatus === "APPROVED").length > 0;

  // Add an effect to auto-select the first family when user has only joined one family
  useEffect(() => {
    if (families && families.length === 1 && families[0].userMembershipStatus === "APPROVED") {
      setSelectedFamily(families[0].id);
    }
  }, [families]);

  // Album limit data fetch based on selected family
  const { data: albumLimitData } = useQuery({
    queryKey: ["albumLimit", selectedFamily],
    queryFn: async () => {
      try {
        // If a specific family is selected, fetch its stats
        if (selectedFamily !== "ALL") {
          const response = await fetch(`/api/families/${selectedFamily}/stats`);
          const result = await response.json();
          
          if (result.success) {
            return {
              familyId: selectedFamily,
              familyName: families?.find((f: Family) => f.id === selectedFamily)?.name || "Your Family",
              currentAlbums: result.data.albumStats.currentMonthAlbums,
              albumLimit: result.data.albumStats.albumLimit,
              resetDate: result.data.albumStats.resetDate
            };
          }
        } 
        
        // If no specific family is selected or API call failed, use the first available family
        if (families && families.length > 0) {
          // Find the first family with APPROVED status
          const firstFamily = families.find((f: Family) => f.userMembershipStatus === "APPROVED");
          
          if (firstFamily) {
            const response = await fetch(`/api/families/${firstFamily.id}/stats`);
            const result = await response.json();
            
            if (result.success) {
              return {
                familyId: firstFamily.id,
                familyName: firstFamily.name,
                currentAlbums: result.data.albumStats.currentMonthAlbums,
                albumLimit: result.data.albumStats.albumLimit,
                resetDate: result.data.albumStats.resetDate
              };
            }
          }
        }
        
        // Fallback if API call fails
        return {
          familyId: "",
          familyName: "Your Family",
          currentAlbums: 0,
          albumLimit: 5, // Default album limit
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        };
      } catch (error) {
        console.error("Error fetching album limit data:", error);
        // Fallback data
        return {
          familyId: "",
          familyName: "Your Family",
          currentAlbums: 0,
          albumLimit: 5, // Default album limit
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        };
      }
    },
    // Refetch when family selection changes
    enabled: hasJoinedFamilies,
    // Don't cache the data for too long
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Filter and sort albums
  const filteredAlbums = albums?.filter((album) => {
    // Apply search filter
    if (
      debouncedSearch &&
      !album.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    ) {
      return false;
    }

    // Apply family filter - only filter if there's more than one family and a specific one is selected
    const approvedFamilies = families?.filter((f: Family) => f.userMembershipStatus === "APPROVED") || [];
    if (approvedFamilies.length > 1 && selectedFamily !== "ALL" && album.familyId !== selectedFamily) {
      return false;
    }

    // Apply type filter
    switch (filter) {
      case "NORMAL":
        return !album.event;
      case "EVENTS":
        return !!album.event;
      default:
        return true;
    }
  });

  // Sort albums
  const sortedAlbums = [...(filteredAlbums || [])].sort((a, b) => {
    switch (sort) {
      case "OLDEST":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "MOST_PHOTOS":
        return b.mediaCount - a.mediaCount;
      default: // NEWEST
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });

  // Paginate albums
  const totalPages = Math.ceil((sortedAlbums?.length || 0) / ALBUMS_PER_PAGE);
  const paginatedAlbums = sortedAlbums?.slice(
    (currentPage - 1) * ALBUMS_PER_PAGE,
    currentPage * ALBUMS_PER_PAGE
  );

  // Calculate counts
  const counts = {
    all: albums?.length || 0,
    normal: albums?.filter((a) => !a.event).length || 0,
    events: albums?.filter((a) => !!a.event).length || 0,
  };

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
        <span className="text-rose-500 font-medium shrink-0">Albums</span>
      </motion.div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-rose-100/50 mb-6 md:mb-8"
      >
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 ${hasJoinedFamilies ? "mb-4 md:mb-6" : "mb-0"}`}>
          <div className="text-center md:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-lora font-bold text-gray-800 mb-2">
              Family Albums 🖼️
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
              Create and view photo albums for your precious memories
            </p>
          </div>
          <div className="w-full md:w-auto">
            <Button 
              className={`flex items-center justify-center gap-2 w-full md:w-auto ${
                albumLimitData && albumLimitData.currentAlbums >= albumLimitData.albumLimit
                  ? "bg-gray-300 hover:bg-gray-300 cursor-not-allowed"
                  : "bg-rose-500 hover:bg-rose-600"
              }`}
              disabled={!hasJoinedFamilies || (albumLimitData && albumLimitData.currentAlbums >= albumLimitData.albumLimit)}
              title={
                !hasJoinedFamilies 
                  ? "Join a family to create albums" 
                  : (albumLimitData && albumLimitData.currentAlbums >= albumLimitData.albumLimit)
                    ? "Monthly album limit reached"
                    : "Create a new album"
              }
              onClick={async () => {
                if (!hasJoinedFamilies) return;
                
                try {
                  // Get the family to check (either selected family or first available)
                  let familyId = "";
                  
                  if (selectedFamily !== "ALL") {
                    familyId = selectedFamily;
                  } else if (families && families.length > 0) {
                    const firstFamily = families.find((f: Family) => f.userMembershipStatus === "APPROVED");
                    if (firstFamily) {
                      familyId = firstFamily.id;
                    }
                  }
                  
                  if (!familyId) {
                    toast.error("No family available to create album in");
                    return;
                  }
                  
                  // Check album limit with fresh data from API
                  const response = await fetch(`/api/families/${familyId}/stats`);
                  const result = await response.json();
                  
                  if (result.success && 
                      result.data.albumStats.currentMonthAlbums >= result.data.albumStats.albumLimit) {
                    toast.error("Monthly album limit reached. Upgrade to Premium for unlimited albums.");
                    setAlbumLimitModalOpen(true);
                  } else {
                    // Navigate to album creation page
                    window.location.href = "/albums/create";
                  }
                } catch (error) {
                  console.error("Error checking album limit:", error);
                  // If we can't check the limit, allow creating an album anyway
                  window.location.href = "/albums/create";
                }
              }}
            >
              {albumLimitData && albumLimitData.currentAlbums >= albumLimitData.albumLimit ? (
                <Lock className="w-4 h-4 mr-1" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              <span>Create Album</span>
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        {
          hasJoinedFamilies && (
            <div className="flex flex-col xl:flex-row xl:items-center gap-3 md:gap-4">
              <div className="relative w-full xl:flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search albums..."
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-10 bg-white w-full h-10 md:h-auto"
                />
              </div>
              <div className="flex flex-col md:flex-row md:w-full xl:w-auto gap-2 md:gap-2 xl:flex-shrink-0">
                {/* Family Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 w-full md:w-1/3 xl:w-auto h-10 md:h-auto"
                      disabled={families && families.filter((f: Family) => f.userMembershipStatus === "APPROVED").length <= 1}
                    >
                      <Home className="w-4 h-4" />
                      <span className="truncate text-sm sm:text-base">
                        {selectedFamily === "ALL"
                          ? "All Families"
                          : families?.find((f: Family) => f.id === selectedFamily)?.name || "Select Family"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-60 overflow-y-auto w-56">
                    <DropdownMenuRadioGroup
                      value={selectedFamily}
                      onValueChange={(value) => {
                        setSelectedFamily(value);
                        queryClient.invalidateQueries({ queryKey: ["albumLimit"] }); // Force refetch of album limits
                      }}
                    >
                      {families && families.filter((f: Family) => f.userMembershipStatus === "APPROVED").length > 1 && (
                        <DropdownMenuRadioItem value="ALL">
                          All Families
                        </DropdownMenuRadioItem>
                      )}
                      {families?.map((family: Family) => (
                        <DropdownMenuRadioItem key={family.id} value={family.id}>
                          {family.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 w-full md:w-1/3 xl:w-auto h-10 md:h-auto"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span className="truncate text-sm sm:text-base">
                        {filter === "ALL"
                          ? "All Albums"
                          : filter === "NORMAL"
                            ? "Normal Albums"
                            : "Event Albums"}
                      </span>
                      <span className="ml-1 text-xs text-gray-500 hidden md:inline">
                        (
                        {filter === "ALL"
                          ? counts.all
                          : filter === "NORMAL"
                            ? counts.normal
                            : counts.events}
                        )
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuRadioGroup
                      value={filter}
                      onValueChange={(value) => setFilter(value as FilterType)}
                    >
                      <DropdownMenuRadioItem value="ALL">
                        All Albums ({counts.all})
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="NORMAL">
                        Normal Albums ({counts.normal})
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="EVENTS">
                        Event Albums ({counts.events})
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 w-full md:w-1/3 xl:w-auto h-10 md:h-auto"
                    >
                      <Clock className="w-4 h-4" />
                      <span className="truncate text-sm sm:text-base">
                        {sort === "NEWEST"
                          ? "Newest First"
                          : sort === "OLDEST"
                            ? "Oldest First"
                            : "Most Photos"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuRadioGroup
                      value={sort}
                      onValueChange={(value) => setSort(value as SortType)}
                    >
                      <DropdownMenuRadioItem value="NEWEST">
                        Newest First
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="OLDEST">
                        Oldest First
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="MOST_PHOTOS">
                        Most Photos
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        }

        {/* Album Limit Progress Bar - Show for all families */}
        {hasJoinedFamilies && albumLimitData && (
          <AlbumLimitProgressBar 
            currentAlbums={albumLimitData.currentAlbums}
            albumLimit={albumLimitData.albumLimit}
            familyName={albumLimitData.familyName}
            onUpgradeClick={() => setAlbumLimitModalOpen(true)}
            resetDate={albumLimitData.resetDate}
          />
        )}
      </motion.div>

      {/* Albums Grid */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(ALBUMS_PER_PAGE)].map((_, index) => (
              <AlbumSkeletonCard key={index} />
            ))}
          </div>
        ) : !sortedAlbums?.length ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 text-center border border-rose-100/50"
          >
            <div className="bg-rose-50 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-lora font-bold text-gray-800 mb-2">
              {debouncedSearch ? "No matching albums found" : "No Albums Yet"}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4 sm:mb-6 text-xs sm:text-base">
              {debouncedSearch
                ? "Try adjusting your search or filters"
                : hasJoinedFamilies 
                  ? "Start creating beautiful albums to organize your family memories!"
                  : "Join a family to start creating albums and sharing memories."}
            </p>
            {!debouncedSearch && (
              hasJoinedFamilies ? (
                <Link href="/albums/create" className="w-full sm:w-auto">
                  <Button className="bg-rose-500 hover:bg-rose-600 w-full sm:w-auto">
                    Create Your First Album
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button className="bg-rose-500 hover:bg-rose-600 w-full sm:w-auto">
                    Join or Create a Family
                  </Button>
                </Link>
              )
            )}
          </motion.div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
              <AnimatePresence mode="popLayout">
                {paginatedAlbums.map((album, index) => (
                  <motion.div
                    key={album.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative bg-white/80 backdrop-blur-md rounded-2xl border border-rose-100/50 overflow-hidden hover:shadow-lg transition-all"
                  >
                    {album.isAdmin && (
                      <>
                        <div className="absolute top-2 right-11 z-30 bg-white/70 backdrop-blur-sm p-0.5 rounded-md shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-blue-500 hover:bg-blue-50/50 w-6 h-6 sm:w-7 sm:h-7"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setAlbumToEdit(album);
                              setIsEditAlbumModalOpen(true);
                            }}
                            title="Edit Album"
                          >
                            <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                        <div className="absolute top-2 right-2 z-30 bg-white/70 backdrop-blur-sm p-0.5 rounded-md shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-red-500 hover:bg-red-50/50 w-6 h-6 sm:w-7 sm:h-7"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setAlbumToDelete({
                                id: album.id,
                                name: album.name,
                              });
                              setIsDeleteAlbumConfirmModalOpen(true);
                            }}
                            title="Delete Album"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                    <Link href={`/albums/${album.id}`}>
                      <div className="aspect-[4/3] relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                        {album.coverImage ? (
                          <img
                            src={album.coverImage}
                            alt={album.name}
                            className="w-full h-full object-cover transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-rose-50 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 text-rose-300" />
                          </div>
                        )}
                        {album.event && (
                          <div className="absolute top-2 left-2 z-20 flex gap-2">
                            <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-full">
                              {album.event.title}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-20">
                          <h3 className="text-white font-bold text-lg sm:text-xl mb-1 line-clamp-1">
                            {album.name}
                          </h3>
                          <p className="text-white/90 text-xs sm:text-sm line-clamp-1">
                            {album.family.name}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                          <span>{album.mediaCount} items</span>
                          <span className="hidden sm:inline">
                            {new Date(album.createdAt).toLocaleDateString()}
                          </span>
                          <span className="sm:hidden">
                            {new Date(album.createdAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        </div>
                        
                        {/* Add Media Limit Indicator */}
                        <MediaLimitIndicator current={album.mediaCount} limit={15} />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-6 sm:mt-8">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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
                        variant={
                          pageNum === currentPage ? "default" : "outline"
                        }
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render EditAlbumModal */}
      <EditAlbumModal
        isOpen={isEditAlbumModalOpen}
        onClose={() => setIsEditAlbumModalOpen(false)}
        albumToEdit={albumToEdit}
      />

      {/* Render DeleteAlbumConfirmationModal */}
      <DeleteAlbumConfirmationModal
        isOpen={isDeleteAlbumConfirmModalOpen}
        onClose={() => setIsDeleteAlbumConfirmModalOpen(false)}
        albumToDelete={albumToDelete}
      />

      {/* Add Premium Upgrade Modal for Album Limits */}
      <PremiumUpgradeModal 
        isOpen={albumLimitModalOpen} 
        onClose={() => setAlbumLimitModalOpen(false)} 
        featureContext="albums" 
      />
    </div>
  );
}
