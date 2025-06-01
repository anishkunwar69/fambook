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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  Clock,
  Home,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
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

// Skeleton Card Component for Albums
function AlbumSkeletonCard() {
  return (
    <div className="group relative bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] relative">
        <div className="w-full h-full bg-gray-200"></div> {/* Skeleton Image */}
      </div>
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>{" "}
        {/* Skeleton Title */}
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>{" "}
        {/* Skeleton Family Name */}
        <div className="flex items-center justify-between text-sm">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>{" "}
          {/* Skeleton Item Count */}
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>{" "}
          {/* Skeleton Date */}
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
      toast.error(error.message || "Could not update album.");
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
        // Allow 200 for success with body, or 204 for no body
        throw new Error(result.message || "Failed to delete album");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Album deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete album.");
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

export default function AlbumsPage() {
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [sort, setSort] = useState<SortType>("NEWEST");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

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
        throw new Error(result.message);
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
        throw new Error(result.message);
      }
      return result.data;
    },
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

    // Apply family filter
    if (selectedFamily !== "ALL" && album.familyId !== selectedFamily) {
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-8">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-8"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-rose-500 font-medium">Albums</span>
      </motion.div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-rose-100/50 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-lora font-bold text-gray-800 mb-2">
              Family Albums 🖼️
            </h1>
            <p className="text-gray-600">
              Create and view photo albums for your precious memories
            </p>
          </div>
          <Link href="/albums/create">
            <Button className="bg-rose-500 hover:bg-rose-600 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Album
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search albums..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 bg-white"
            />
          </div>
          <div className="flex gap-2">
            {/* Family Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  {selectedFamily === "ALL" 
                    ? "All Families" 
                    : families?.find((f: any) => f.id === selectedFamily)
                        ?.name || "Select Family"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-60 overflow-y-auto">
                <DropdownMenuRadioGroup
                  value={selectedFamily}
                  onValueChange={setSelectedFamily}
                >
                  <DropdownMenuRadioItem value="ALL">
                    All Families
                  </DropdownMenuRadioItem>
                  {families?.map((family: any) => (
                    <DropdownMenuRadioItem key={family.id} value={family.id}>
                      {family.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  {filter === "ALL"
                    ? "All Albums"
                    : filter === "NORMAL"
                      ? "Normal Albums"
                      : "Event Albums"}
                  <span className="ml-1 text-xs text-gray-500">
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
              <DropdownMenuContent>
                <DropdownMenuRadioGroup
                  value={filter}
                  onValueChange={(value) => setFilter(value as FilterType)}
                >
                  <DropdownMenuRadioItem
                    value="ALL"
                    className="flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    All Albums ({counts.all})
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="NORMAL"
                    className="flex items-center gap-2"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Normal Albums ({counts.normal})
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="EVENTS"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Event Albums ({counts.events})
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {sort === "NEWEST"
                    ? "Newest First"
                    : sort === "OLDEST"
                      ? "Oldest First"
                      : "Most Photos"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
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
      </motion.div>

      {/* Albums Grid */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(ALBUMS_PER_PAGE)].map((_, index) => (
              <AlbumSkeletonCard key={index} />
            ))}
          </div>
        ) : !sortedAlbums?.length ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-8 text-center border border-rose-100/50"
          >
            <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-lora font-bold text-gray-800 mb-2">
              {debouncedSearch ? "No matching albums found" : "No Albums Yet"}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {debouncedSearch
                ? "Try adjusting your search or filters"
                : "Start creating beautiful albums to organize your family memories!"}
            </p>
            {!debouncedSearch && (
              <Link href="/albums/create">
                <Button className="bg-rose-500 hover:bg-rose-600">
                  Create Your First Album
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            className="text-gray-500 hover:text-blue-500 hover:bg-blue-50/50 w-7 h-7"
                            onClick={(e) => {
                              e.preventDefault(); // Prevent link navigation
                              e.stopPropagation();
                              setAlbumToEdit(album);
                              setIsEditAlbumModalOpen(true);
                            }}
                            title="Edit Album"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="absolute top-2 right-2 z-30 bg-white/70 backdrop-blur-sm p-0.5 rounded-md shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-red-500 hover:bg-red-50/50 w-7 h-7"
                            onClick={(e) => {
                              e.preventDefault(); // Prevent link navigation
                              e.stopPropagation();
                              setAlbumToDelete({
                                id: album.id,
                                name: album.name,
                              });
                              setIsDeleteAlbumConfirmModalOpen(true);
                            }}
                            title="Delete Album"
                          >
                            <Trash2 className="w-4 h-4" />
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
                            <ImageIcon className="w-12 h-12 text-rose-300" />
                          </div>
                        )}
                        {album.event && (
                          <div className="absolute top-2 left-2 z-20 flex gap-2">
                            <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-full">
                              {album.event.title}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4 right-4 z-20">
                          <h3 className="text-white font-bold text-xl mb-1 line-clamp-1">
                            {album.name}
                          </h3>
                          <p className="text-white/90 text-sm line-clamp-1">
                            {album.family.name}
                          </p>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{album.mediaCount} items</span>
                          <span>
                            {new Date(album.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                    <Button
                      key={pageNum}
                        variant={
                          pageNum === currentPage ? "default" : "outline"
                        }
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 ${
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
                  className="flex items-center gap-2"
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
    </div>
  );
} 
