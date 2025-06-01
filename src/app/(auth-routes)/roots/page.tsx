"use client";

import GlobalFamilyRootCard, {
  GlobalFamilyRoot,
} from "@/components/GlobalFamilyRootCard";
import CreateRootModal from "@/components/modals/CreateRootModal";
import NoFamilyForRootModal from "@/components/modals/NoFamilyForRootModal";
import GlobalFamilyRootSkeletonCard from "@/components/skeletons/GlobalFamilyRootSkeletonCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
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
import { useCallback, useState } from "react";

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

const ROOTS_PER_PAGE = 9; // Adjust as needed

export default function AllFamilyRootsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateRootModalOpen, setIsCreateRootModalOpen] = useState(false);

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
    data: allRoots,
    isLoading: isLoadingRoots,
    isError: isErrorRoots,
    error: errorRoots,
    refetch: refetchRoots,
    isFetching: isFetchingRoots,
  } = useQuery<GlobalFamilyRoot[], Error>({
    queryKey: ["allFamilyRoots"],
    queryFn: async () => {
      const response = await fetch("/api/roots");
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch roots");
      }
      return result.data;
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
        <span className="text-rose-500 font-medium flex items-center gap-1">
          Family Trees
        </span>
      </motion.div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-rose-100/50 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-lora font-bold text-gray-800 mb-2 flex items-center gap-2">
              Family Trees 🌳
            </h1>
            <p className="text-gray-600">
              Browse and manage all family trees you are a part of.
            </p>
          </div>
          <Button
            className="bg-rose-500 hover:bg-rose-600 flex items-center gap-2"
            onClick={() => setIsCreateRootModalOpen(true)}
          >
            <PlusCircle className="w-4 h-4" />
            Create New Tree
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search roots by name or description..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 bg-white w-full"
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {selectedFamily === "ALL"
                    ? "All Families"
                    : familiesForFilter?.find((f) => f.id === selectedFamily)
                        ?.name || "Select Family"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-60 overflow-y-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: ROOTS_PER_PAGE }).map((_, index) => (
              <GlobalFamilyRootSkeletonCard key={`skeleton-${index}`} />
            ))}
          </div>
        ) : isErrorRoots ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50/50 backdrop-blur-md rounded-2xl p-12 text-center border border-red-100/50 text-red-700 w-full"
          >
            <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-lora font-bold text-red-800 mb-2">
              Failed to Load Roots
            </h3>
            <p className="text-red-600 max-w-md mx-auto mb-6">
              {errorRoots?.message ||
                "An unexpected error occurred. Please try again."}
            </p>
            <Button
              onClick={() => refetchRoots()}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-70"
              disabled={isFetchingRoots}
            >
              <Loader2
                className={`mr-2 h-5 w-5 animate-spin ${isFetchingRoots ? "inline-flex" : "hidden"}`}
              />
              {isFetchingRoots ? "Retrying..." : "Retry"}
            </Button>
          </motion.div>
        ) : !paginatedRoots || paginatedRoots.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white/80 backdrop-blur-md rounded-2xl p-12 text-center border border-rose-100/50 text-gray-600 w-full ${(debouncedSearch || selectedFamily !== "ALL") && "hidden"}`}
          >
            <div className="bg-rose-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trees className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-lora font-bold text-gray-800 mb-2">
              No Family Trees Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Once family trees are created in your families, they will appear
              here. Or you can start a new one!
            </p>
            <Button
              onClick={() => setIsCreateRootModalOpen(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-opacity-50 flex items-center gap-2 mx-auto"
            >
              <PlusCircle className="w-5 h-5" />
              Create Family Tree
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {paginatedRoots.map((root, index) => (
                  <motion.div
                    key={root.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlobalFamilyRootCard root={root} />
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
                <div className="flex items-center gap-2 flex-wrap justify-center">
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
                  className="flex items-center gap-2"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {isCreateRootModalOpen &&
        familiesForFilter &&
        familiesForFilter.length > 0 && (
          <CreateRootModal
            isOpen={isCreateRootModalOpen}
            onClose={() => setIsCreateRootModalOpen(false)}
            families={familiesForFilter}
          />
        )}
      {isCreateRootModalOpen &&
        (!familiesForFilter || familiesForFilter.length === 0) &&
        !isLoadingFamilies && (
          <NoFamilyForRootModal
            isOpen={isCreateRootModalOpen}
            onClose={() => setIsCreateRootModalOpen(false)}
          />
        )}
    </div>
  );
}
