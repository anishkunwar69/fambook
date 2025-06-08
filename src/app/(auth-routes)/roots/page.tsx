"use client";

import GlobalFamilyRootCard, {
  GlobalFamilyRoot,
} from "@/components/GlobalFamilyRootCard";
import CreateRootModal from "@/components/modals/CreateRootModal";
import NoFamilyForRootModal from "@/components/modals/NoFamilyForRootModal";
import GlobalFamilyRootSkeletonCard from "@/components/skeletons/GlobalFamilyRootSkeletonCard";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronRight,
  Home,
  Loader2,
  PlusCircle,
  Search,
  Trees,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

// Delete Confirmation Modal Component (similar to families page)
function DeleteRootModal({
  isOpen,
  onClose,
  rootToDelete,
  onConfirmDelete,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  rootToDelete: { id: string; name: string } | null;
  onConfirmDelete: (rootId: string) => void;
  isDeleting: boolean;
}) {
  const [confirmationName, setConfirmationName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setConfirmationName("");
    }
  }, [isOpen]);

  const isMatch = rootToDelete ? confirmationName === rootToDelete.name : false;

  if (!rootToDelete) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-red-100/50">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Delete Family Tree
          </DialogTitle>
          <DialogDescription className="pt-2">
            This action is permanent and cannot be undone. To confirm, please
            type the name of the tree:{" "}
            <strong className="text-gray-800">{rootToDelete.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label
            htmlFor="confirmationName"
            className="text-sm font-medium text-gray-700"
          >
            Tree Name
          </Label>
          <Input
            id="confirmationName"
            value={confirmationName}
            onChange={(e) => setConfirmationName(e.target.value)}
            placeholder={rootToDelete.name}
            className="border-gray-300 focus:border-red-500 focus:ring-red-500/50"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirmDelete(rootToDelete.id)}
            disabled={!isMatch || isDeleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
              </>
            ) : (
              "Delete Tree"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Debounce function (copied from albums/page.tsx)
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

type FamilyForFilter = {
  id: string;
  name: string;
};

const ROOTS_PER_PAGE = 6;

// Define the API response structure for roots
type RootsApiResponse = {
  data: GlobalFamilyRoot[];
  currentInternalUserId?: string; // Optional because it's added in the API
};

export default function AllFamilyRootsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateRootModalOpen, setIsCreateRootModalOpen] = useState(false);
  const [rootToDelete, setRootToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 500),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  // Fetch all roots
  const {
    data: rootsData,
    isLoading: isLoadingRoots,
    isError: isErrorRoots,
    error: errorRoots,
    refetch: refetchRoots,
    isFetching: isFetchingRoots,
  } = useQuery<RootsApiResponse, Error>({
    queryKey: ["allFamilyRoots"],
    queryFn: async () => {
      const response = await fetch("/api/roots");
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch roots");
      }
      return result; // The API now returns { success, data, currentInternalUserId }
    },
  });

  const allRoots = rootsData?.data;

  // Delete Root Mutation
  const deleteRootMutation = useMutation({
    mutationFn: async (rootId: string) => {
      const response = await fetch(`/api/roots/${rootId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorResult = await response
          .json()
          .catch(() => ({ message: "Failed to delete family tree" }));
        throw new Error(errorResult.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Family tree deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["allFamilyRoots"] });
      setRootToDelete(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not delete family tree.");
    },
  });

  // Fetch user's families for the filter dropdown
  const { data: familiesForFilter, isLoading: isLoadingFamilies } = useQuery<
    FamilyForFilter[],
    Error
  >({
    queryKey: ["familiesForFilter"],
    queryFn: async () => {
      const response = await fetch("/api/families"); // Assuming this endpoint returns [{id, name}, ...]
      const result = await response.json();
      if (!result.success) {
        throw new Error(
          result.message || "Failed to fetch families for filter"
        );
      }
      return result.data;
    },
  });

  const filteredRoots = allRoots?.filter((root) => {
    if (
      debouncedSearch &&
      !root.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
      !(
        root.description &&
        root.description.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    ) {
      return false;
    }
    if (selectedFamily !== "ALL" && root.family.id !== selectedFamily) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil((filteredRoots?.length || 0) / ROOTS_PER_PAGE);
  const paginatedRoots = filteredRoots?.slice(
    (currentPage - 1) * ROOTS_PER_PAGE,
    currentPage * ROOTS_PER_PAGE
  );

  // Filter families to only include those without an existing root
  const familiesWithoutRoots = useMemo(() => {
    if (!familiesForFilter || !allRoots) {
      return familiesForFilter; // Return all families if roots haven't loaded yet, or if no families
    }
    const familiesWithRootsIds = new Set(
      allRoots.map((root) => root.family.id)
    );
    return familiesForFilter.filter(
      (family) => !familiesWithRootsIds.has(family.id)
    );
  }, [familiesForFilter, allRoots]);

  const allFamiliesHaveRootsState = useMemo(() => {
    if (isLoadingFamilies || isLoadingRoots) return false;
    // True if families list is not empty, but the list of families eligible for new roots is empty.
    return (
      !!familiesForFilter &&
      familiesForFilter.length > 0 &&
      !!familiesWithoutRoots &&
      familiesWithoutRoots.length === 0
    );
  }, [
    familiesForFilter,
    familiesWithoutRoots,
    isLoadingFamilies,
    isLoadingRoots,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1 shrink-0"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <span className="text-rose-500 font-medium flex items-center gap-1 shrink-0">
          Family Trees
        </span>
      </motion.div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-rose-100/50 mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-lora font-bold text-gray-800 mb-2 flex items-center justify-center sm:justify-start gap-2">
              Family Trees 🌳
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Browse and manage all family trees you are a part of.
            </p>
          </div>
          <Button
            className="bg-rose-500 hover:bg-rose-600 flex items-center justify-center gap-2 w-full sm:w-auto"
            onClick={() => setIsCreateRootModalOpen(true)}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Tree</span>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <div className="relative w-full sm:flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search roots by name or description..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 bg-white w-full h-10"
            />
          </div>
          <div className="flex justify-center w-full sm:w-auto sm:justify-start sm:flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto h-10"
                >
                  <Users className="w-4 h-4" />
                  <span className="truncate text-sm sm:text-base">
                    {selectedFamily === "ALL"
                      ? "All Families"
                      : familiesForFilter?.find((f) => f.id === selectedFamily)
                          ?.name || "Select Family"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-60 overflow-y-auto w-56">
                <DropdownMenuRadioGroup
                  value={selectedFamily}
                  onValueChange={(value) => {
                    setSelectedFamily(value);
                    setCurrentPage(1);
                  }}
                >
                  <DropdownMenuRadioItem value="ALL">
                    All Families
                  </DropdownMenuRadioItem>
                  {isLoadingFamilies ? (
                    <DropdownMenuRadioItem value="loading" disabled>
                      Loading families...
                    </DropdownMenuRadioItem>
                  ) : (
                    familiesForFilter?.map((family) => (
                      <DropdownMenuRadioItem key={family.id} value={family.id}>
                        {family.name}
                      </DropdownMenuRadioItem>
                    ))
                  )}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* Roots Grid or States */}
      <div>
        {isLoadingRoots ? (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: ROOTS_PER_PAGE }).map((_, index) => (
              <GlobalFamilyRootSkeletonCard key={`skeleton-${index}`} />
            ))}
          </div>
        ) : isErrorRoots ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50/50 backdrop-blur-md rounded-2xl p-6 sm:p-12 text-center border border-red-100/50 text-red-700 w-full"
          >
            <div className="bg-red-100 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-lora font-bold text-red-800 mb-2">
              Failed to Load Roots
            </h3>
            <p className="text-red-600 max-w-md mx-auto mb-4 sm:mb-6 text-sm sm:text-base">
              {errorRoots?.message ||
                "An unexpected error occurred. Please try again."}
            </p>
            <Button
              onClick={() => refetchRoots()}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-70 w-full sm:w-auto"
              disabled={isFetchingRoots}
            >
              <Loader2
                className={`mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin ${isFetchingRoots ? "inline-flex" : "hidden"}`}
              />
              {isFetchingRoots ? "Retrying..." : "Retry"}
            </Button>
          </motion.div>
        ) : !paginatedRoots || paginatedRoots.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white/80 backdrop-blur-md rounded-2xl p-6 sm:p-12 text-center border border-rose-100/50 text-gray-600 w-full ${(debouncedSearch || selectedFamily !== "ALL") && "hidden"}`}
          >
            <div className="bg-rose-50 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Trees className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-lora font-bold text-gray-800 mb-2">
              No Family Trees Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-4 sm:mb-6 text-sm sm:text-base">
              Once family trees are created in your families, they will appear
              here. Or you can start a new one!
            </p>
            <Button
              onClick={() => setIsCreateRootModalOpen(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-opacity-50 flex items-center gap-2 mx-auto w-full sm:w-auto"
            >
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Create Family Tree</span>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
              <AnimatePresence mode="popLayout">
                {paginatedRoots.map((root, index) => (
                  <motion.div
                    key={root.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlobalFamilyRootCard
                      root={root}
                      onDelete={setRootToDelete}
                    />
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
                            ? "bg-rose-500 hover:bg-rose-600 text-white"
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

      {isCreateRootModalOpen &&
        familiesWithoutRoots &&
        familiesWithoutRoots.length > 0 && (
          <CreateRootModal
            isOpen={isCreateRootModalOpen}
            onClose={() => setIsCreateRootModalOpen(false)}
            families={familiesWithoutRoots}
          />
        )}
      {isCreateRootModalOpen &&
        (!familiesWithoutRoots || familiesWithoutRoots.length === 0) &&
        !isLoadingFamilies &&
        !isLoadingRoots && (
          <NoFamilyForRootModal
            isOpen={isCreateRootModalOpen}
            onClose={() => setIsCreateRootModalOpen(false)}
            allFamiliesHaveRoots={allFamiliesHaveRootsState}
          />
        )}

      {/* Delete Confirmation Modal */}
      <DeleteRootModal
        isOpen={!!rootToDelete}
        onClose={() => setRootToDelete(null)}
        rootToDelete={rootToDelete}
        onConfirmDelete={(rootId) => deleteRootMutation.mutate(rootId)}
        isDeleting={deleteRootMutation.isPending}
      />
    </div>
  );
}
