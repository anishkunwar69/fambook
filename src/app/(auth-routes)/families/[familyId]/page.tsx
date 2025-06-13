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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Family, FamilyMember } from "@/types/family.types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Home,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Shield,
  TreePine,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

type FamilyWithExtra = Family & {
  currentUserId: string;
  pendingRequestsCount: number;
};

type FamilyStats = {
  members: {
    total: number;
    approved: number;
    pending: number;
  };
  content: {
    posts: {
      last24Hours: number;
      lastWeek: number;
      lastMonth: number;
    };
    albums: {
      total: number;
      totalMedia: number;
    };
    events: {
      upcoming: number;
    };
  };
};

type FamilyMemberWithUser = {
  id: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    username: string | null;
    imageUrl: string | null;
  };
};

function BreadcrumbSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-sm text-gray-600 mb-4 sm:mb-6 overflow-hidden mt-[8px] w-full"
    >
      <div className="h-4 bg-gray-200 rounded animate-pulse w-8 shrink-0" />
      <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse shrink-0" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-16 shrink-0" />
      <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse shrink-0" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-20 shrink-0" />
    </motion.div>
  );
}

function FamilyHeaderSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-4 sm:mb-6 overflow-hidden w-full"
    >
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-rose-100/50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <div className="h-8 sm:h-10 bg-gray-200 rounded animate-pulse w-3/4 sm:w-64 max-w-full" />
          <div className="h-6 sm:h-7 bg-gray-200 rounded-full animate-pulse w-16 hidden sm:block" />
        </div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full sm:w-3/4 max-w-full" />
      </div>
    </motion.div>
  );
}

function QuickActionsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 sm:mb-6 w-full"
    >
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-rose-100/50">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="bg-gray-200 w-8 h-8 sm:w-10 sm:h-10 rounded-lg animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 sm:h-5 bg-gray-200 rounded animate-pulse w-24 sm:w-32 mb-1 sm:mb-2" />
            <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-32 sm:w-48 max-w-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-rose-100/50"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="bg-gray-200 w-8 h-8 sm:w-12 sm:h-12 rounded-lg animate-pulse" />
                <div className="w-full">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-12 sm:w-16 mb-1 mx-auto" />
                  <div className="h-2 sm:h-3 bg-gray-200 rounded animate-pulse w-16 sm:w-20 mx-auto hidden sm:block" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function AdminActionsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 sm:mb-6 w-full"
    >
      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="bg-gray-200 w-8 h-8 sm:w-10 sm:h-10 rounded-lg animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 sm:h-5 bg-gray-200 rounded animate-pulse w-24 sm:w-32 mb-1 sm:mb-2" />
            <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-32 sm:w-40 max-w-full" />
          </div>
        </div>

        <div className="w-full">
          <div className="bg-white/80 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-amber-100/50">
            <div className="flex items-center gap-3">
              <div className="bg-gray-200 w-8 h-8 sm:w-10 sm:h-10 rounded-lg animate-pulse shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-20 sm:w-28 mb-1 sm:mb-2" />
                <div className="h-2 sm:h-3 bg-gray-200 rounded animate-pulse w-24 sm:w-36 max-w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MemberSkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-gray-50/80 border border-gray-100/50 animate-pulse"
    >
      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gray-200 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-3 sm:h-4 bg-gray-200 rounded mb-1 sm:mb-2 w-24 sm:w-32" />
        <div className="h-2 sm:h-3 bg-gray-200 rounded w-16 sm:w-24" />
      </div>
      <div className="w-12 sm:w-16 md:w-20 h-6 sm:h-8 bg-gray-200 rounded shrink-0" />
    </motion.div>
  );
}

function MembersCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full"
    >
      <Card className="bg-white/80 backdrop-blur-md border-rose-100/50 overflow-hidden">
        <CardHeader className="border-b border-rose-100/20 bg-gradient-to-r from-rose-50/50 via-rose-100/30 to-transparent p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-32 sm:w-40 mb-1 sm:mb-2" />
              <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-40 sm:w-48 max-w-full" />
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-16 sm:w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            {[...Array(5)].map((_, index) => (
              <MemberSkeletonCard key={index} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb Skeleton */}
      <BreadcrumbSkeleton />

      {/* Family Header Skeleton */}
      <FamilyHeaderSkeleton />

      {/* Quick Actions Skeleton */}
      <QuickActionsSkeleton />

      {/* Admin Actions Skeleton - Always show for skeleton */}
      <AdminActionsSkeleton />

      {/* Members Card Skeleton */}
      <MembersCardSkeleton />
    </div>
  );
}

export default function FamilyPage() {
  const { familyId } = useParams();

  const {
    data: family,
    isLoading: isFamilyLoading,
    refetch,
  } = useQuery<FamilyWithExtra>({
    queryKey: ["family", familyId],
    queryFn: async () => {
      const response = await fetch(`/api/families/${familyId}`);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery<FamilyStats>({
    queryKey: ["family-stats", familyId],
    queryFn: async () => {
      const response = await fetch(`/api/families/${familyId}/stats`);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  // Infinite query for family members
  const MEMBERS_PER_PAGE = 20;
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
  });

  const {
    data: membersPages,
    isLoading: isMembersLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError: isMembersError,
  } = useInfiniteQuery({
    queryKey: ["family-members", familyId],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        limit: MEMBERS_PER_PAGE.toString(),
      });

      const response = await fetch(
        `/api/families/${familyId}/members?${searchParams}`
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === MEMBERS_PER_PAGE
        ? allPages.length + 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: !!familyId,
  });

  // Load more members when scrolling to the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten members pages
  const allMembers = membersPages?.pages.flat() || [];

  const isAdmin = family?.members.some(
    (member: FamilyMember) =>
      member.userId === family.currentUserId && member.role === "ADMIN"
  );

  const isLoading = isFamilyLoading || isStatsLoading;

  // Show full page skeleton while loading
  if (isLoading) {
    return <FullPageSkeleton />;
  }

  if (!family) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8 w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md rounded-2xl p-6 sm:p-12 text-center border border-red-100/50 text-red-700"
        >
          <div className="bg-red-100 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-lora font-bold text-red-800 mb-2">
            Failed to Load Families
          </h3>
          <p className="text-red-600 max-w-md mx-auto mb-4 sm:mb-6 text-sm sm:text-base">
            An unknown error occurred.
          </p>
          <Button
            onClick={() => refetch()}
            variant="destructive"
            className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
          >
            Retry
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8 max-lg:pb-20">
      {/* Breadcrumb with enhanced interactivity */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap mt-[8px]"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1 group shrink-0"
        >
          <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <Link
          href="/families"
          className="hover:text-rose-500 transition-colors group shrink-0"
        >
          <span className="group-hover:underline">Families</span>
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <span className="text-rose-500 font-medium shrink-0">
          Family Details
        </span>
      </motion.div>

      {/* Family Header with enhanced animations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 sm:mb-8 overflow-hidden group"
      >
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 border border-rose-100/50 transition-all duration-300 hover:bg-white/90 hover:border-rose-200/70">
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-rose-100/20 to-amber-100/20 rounded-full blur-3xl -z-10"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              translateX: "50%",
              translateY: "-50%",
            }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-tr from-rose-100/20 to-purple-100/20 rounded-full blur-3xl -z-10"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              translateX: "-50%",
              translateY: "50%",
            }}
          />

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-lora font-bold text-gray-800 mb-2 sm:mb-3 flex flex-row items-center gap-3">
            <span className="hover:text-rose-600 transition-colors break-words -mb-3">
              {family.name}
            </span>
            {isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <motion.span
                      className="text-xs sm:text-sm font-normal bg-amber-100/50 text-amber-700 px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto border border-amber-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      ADMIN
                    </motion.span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You have admin privileges for this family</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </h1>
          {family.description && (
            <motion.p
              className="text-gray-600 max-w-2xl text-sm sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {family.description}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Quick Actions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-rose-100/50">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <motion.div
              className="bg-rose-100 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
              whileHover={{ rotate: 15 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
            </motion.div>
            <div>
              <h3 className="font-medium text-gray-800 text-sm sm:text-base">
                Quick Actions
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Navigate to different family sections
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Feed */}
            <Link href={`/feed?family=${familyId}`}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-rose-100/50 transition-all duration-300 hover:border-rose-300 hover:shadow-lg group cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="bg-rose-50 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 group-hover:text-rose-600 transition-colors text-xs sm:text-sm">
                      Feed
                    </h4>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Family posts
                    </p>
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Albums */}
            <Link href={`/albums`}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-rose-100/50 transition-all duration-300 hover:border-rose-300 hover:shadow-lg group cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="bg-rose-50 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 group-hover:text-rose-600 transition-colors text-xs sm:text-sm">
                      Albums
                    </h4>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Photo albums
                    </p>
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Events */}
            <Link href={`/events`}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-rose-100/50 transition-all duration-300 hover:border-rose-300 hover:shadow-lg group cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="bg-rose-50 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 group-hover:text-rose-600 transition-colors text-xs sm:text-sm">
                      Events
                    </h4>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Family events
                    </p>
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Family Tree */}
            <Link href={`/roots`}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-rose-100/50 transition-all duration-300 hover:border-rose-300 hover:shadow-lg group cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="bg-rose-50 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TreePine className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 group-hover:text-rose-600 transition-colors text-xs sm:text-sm">
                      Tree
                    </h4>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      Family tree
                    </p>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Admin Actions with enhanced interactivity - Only Join Requests */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 sm:p-6 transition-all duration-300 hover:bg-amber-50/70 hover:border-amber-200">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <motion.div
                className="bg-amber-100 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 15 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              </motion.div>
              <div>
                <h3 className="font-medium text-gray-800 text-sm sm:text-base">
                  Admin Actions
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Manage member requests
                </p>
              </div>
            </div>

            <div className="w-full">
              {/* Join Requests Card */}
              <Link href={`/families/${familyId}/requests`}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/80 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-amber-100/50 transition-all duration-300 hover:border-rose-300 hover:shadow-lg group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-50 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 group-hover:text-rose-600 transition-colors text-sm sm:text-base">
                        Join Requests
                      </h4>
                      <AnimatePresence mode="wait">
                        {family.pendingRequestsCount > 0 ? (
                          <motion.p
                            key="pending"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-xs sm:text-sm text-rose-500 flex items-center gap-1"
                          >
                            {family.pendingRequestsCount} pending
                            <span className="hidden sm:inline">
                              request{family.pendingRequestsCount !== 1 && "s"}
                            </span>
                          </motion.p>
                        ) : (
                          <motion.p
                            key="no-pending"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-xs sm:text-sm text-gray-500"
                          >
                            <span className="hidden sm:inline">
                              No pending requests
                            </span>
                            <span className="sm:hidden">None pending</span>
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content - Full Width Members Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/80 backdrop-blur-md border-rose-100/50 overflow-hidden">
          <CardHeader className="border-b border-rose-100/20 bg-gradient-to-r from-rose-50/50 via-rose-100/30 to-transparent p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="font-lora text-lg sm:text-xl text-rose-700">
                  Family Members
                </CardTitle>
                <CardDescription className="text-sm">
                  All approved family members
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {stats?.members.approved || 0}
                  </span>{" "}
                  members
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {isMembersLoading ? (
              <div className="space-y-3 sm:space-y-4">
                {[...Array(5)].map((_, index) => (
                  <MemberSkeletonCard key={index} />
                ))}
              </div>
            ) : isMembersError ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-red-500 mb-4 text-sm sm:text-base">
                  Failed to load members
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            ) : allMembers.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">
                  No members found
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <AnimatePresence mode="popLayout">
                  {allMembers.map(
                    (member: FamilyMemberWithUser, index: number) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        key={member.id}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-gray-50/80 hover:bg-rose-50/50 transition-all border border-gray-100/50 group"
                      >
                        <div className="relative">
                          <img
                            src={
                              member.user.imageUrl || "/placeholder-avatar.png"
                            }
                            alt={member.user.fullName}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-rose-100 transition-colors"
                          />
                          {member.role === "ADMIN" && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm sm:text-base group-hover:text-rose-600 transition-colors truncate">
                            {member.user.fullName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                member.role === "ADMIN"
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            <span className="capitalize">
                              {member.role.toLowerCase()}
                            </span>
                            {member.user.username && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">
                                  @{member.user.username}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/profile/${member.user.id}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 sm:gap-2 hover:bg-rose-50 hover:text-rose-500 transition-colors h-8 px-2 sm:h-auto sm:px-3"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span className="hidden sm:inline">
                                      Profile
                                    </span>
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View {member.user.fullName}'s profile</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </motion.div>
                    )
                  )}
                </AnimatePresence>

                {/* Load More Trigger */}
                <div ref={loadMoreRef} className="pt-4 flex justify-center">
                  {isFetchingNextPage ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 animate-spin" />
                  ) : hasNextPage ? (
                    <span className="text-gray-500 text-xs sm:text-sm">
                      Loading more members...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-xs sm:text-sm text-rose-600 px-3 sm:px-4 py-2 bg-rose-50 rounded-full border border-rose-200 shadow-sm">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      All members loaded
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
