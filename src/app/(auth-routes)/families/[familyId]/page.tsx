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

function MemberSkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-4 rounded-lg bg-gray-50/80 border border-gray-100/50"
    >
      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
      <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
    </motion.div>
  );
}

function FamilyHeaderSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8 overflow-hidden"
    >
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-rose-100/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-64" />
          <div className="h-7 bg-gray-200 rounded-full animate-pulse w-16" />
        </div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-96 max-w-full" />
      </div>
    </motion.div>
  );
}

function QuickActionsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-rose-100/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gray-200 w-10 h-10 rounded-lg animate-pulse" />
          <div>
            <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-md rounded-lg p-4 border border-rose-100/50">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="bg-gray-200 w-12 h-12 rounded-lg animate-pulse" />
                <div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mb-1" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
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
      className="mb-8"
    >
      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gray-200 w-10 h-10 rounded-lg animate-pulse" />
          <div>
            <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-40" />
          </div>
        </div>

        <div className="max-w-[100%]">
          <div className="bg-white/80 backdrop-blur-md rounded-lg p-4 border border-amber-100/50">
            <div className="flex items-center gap-3">
              <div className="bg-gray-200 w-10 h-10 rounded-lg animate-pulse" />
              <div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-28 mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-36" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MembersCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-white/80 backdrop-blur-md border-rose-100/50 overflow-hidden">
        <CardHeader className="border-b border-rose-100/20 bg-gradient-to-r from-rose-50/50 via-rose-100/30 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-40 mb-2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-8">
      {/* Breadcrumb Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-8"
      >
        <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
      </motion.div>

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

  const { data: family, isLoading: isFamilyLoading } =
    useQuery<FamilyWithExtra>({
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
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-600 p-8 bg-white/80 rounded-2xl border border-rose-100/50"
        >
          Family not found
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-8">
      {/* Breadcrumb with enhanced interactivity */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-8"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1 group"
        >
          <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          href="/families"
          className="hover:text-rose-500 transition-colors group"
        >
          <span className="group-hover:underline">Families</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-rose-500 font-medium">Family Details</span>
      </motion.div>

      {/* Family Header with enhanced animations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden group"
      >
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-rose-100/50 transition-all duration-300 hover:bg-white/90 hover:border-rose-200/70">
          <motion.div 
            className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-100/20 to-amber-100/20 rounded-full blur-3xl -z-10"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              translateX: "50%",
              translateY: "-50%"
            }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-rose-100/20 to-purple-100/20 rounded-full blur-3xl -z-10"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              translateX: "-50%",
              translateY: "50%"
            }}
          />
          
          <h1 className="text-4xl font-lora font-bold text-gray-800 mb-3 flex items-center gap-3">
            <span className="hover:text-rose-600 transition-colors">{family.name}</span>
            {isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <motion.span 
                      className="text-sm font-normal bg-amber-100/50 text-amber-700 px-3 py-1 rounded-full"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Admin
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
              className="text-gray-600 max-w-2xl"
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
        className="mb-8"
      >
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-rose-100/50">
          <div className="flex items-center gap-3 mb-6">
            <motion.div 
              className="bg-rose-100 w-10 h-10 rounded-lg flex items-center justify-center"
              whileHover={{ rotate: 15 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <MessageSquare className="w-5 h-5 text-rose-600" />
            </motion.div>
            <div>
              <h3 className="font-medium text-gray-800">Quick Actions</h3>
              <p className="text-sm text-gray-600">
                Navigate to different family sections
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Feed */}
            <Link href={`/feed?family=${familyId}`}>
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 backdrop-blur-md rounded-lg p-4 border border-rose-100/50 transition-all duration-300 hover:border-rose-300 hover:shadow-lg group cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="bg-rose-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 group-hover:text-rose-600 transition-colors text-sm">
                      Feed
                    </h4>
                    <p className="text-xs text-gray-500">
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
                className="bg-white/80 backdrop-blur-md rounded-lg p-4 border border-rose-100/50 transition-all duration-300 hover:border-rose-300 hover:shadow-lg group cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="bg-rose-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 group-hover:text-rose-600 transition-colors text-sm">
                      Albums
                    </h4>
                    <p className="text-xs text-gray-500">
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
                className="bg-white/80 backdrop-blur-md rounded-lg p-4 border border-rose-100/50 transition-all duration-300 hover:border-rose-300 hover:shadow-lg group cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="bg-rose-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 group-hover:text-rose-600 transition-colors text-sm">
                      Events
                    </h4>
                    <p className="text-xs text-gray-500">
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
                className="bg-white/80 backdrop-blur-md rounded-lg p-4 border border-rose-100/50 transition-all duration-300 hover:border-rose-300 hover:shadow-lg group cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="bg-rose-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TreePine className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 group-hover:text-rose-600 transition-colors text-sm">
                      Tree
                    </h4>
                    <p className="text-xs text-gray-500">
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
          className="mb-8"
        >
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-6 transition-all duration-300 hover:bg-amber-50/70 hover:border-amber-200">
            <div className="flex items-center gap-3 mb-6">
              <motion.div 
                className="bg-amber-100 w-10 h-10 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 15 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Shield className="w-5 h-5 text-amber-600" />
              </motion.div>
              <div>
                <h3 className="font-medium text-gray-800">Admin Actions</h3>
                <p className="text-sm text-gray-600">
                  Manage member requests
                </p>
              </div>
            </div>

            <div className="max-w-[100%]">
              {/* Join Requests Card */}
              <Link href={`/families/${familyId}/requests`}>
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/80 backdrop-blur-md rounded-lg p-4 border border-amber-100/50 transition-all duration-300 hover:border-rose-300 hover:shadow-lg group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-50 w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserPlus className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 group-hover:text-rose-600 transition-colors">
                        Join Requests
                      </h4>
                      <AnimatePresence mode="wait">
                        {family.pendingRequestsCount > 0 ? (
                          <motion.p
                            key="pending"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-sm text-rose-500 flex items-center gap-1"
                          >
                            {family.pendingRequestsCount} pending request
                            {family.pendingRequestsCount !== 1 && "s"}
                          </motion.p>
                        ) : (
                          <motion.p
                            key="no-pending"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-sm text-gray-500"
                          >
                            No pending requests
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
          <CardHeader className="border-b border-rose-100/20 bg-gradient-to-r from-rose-50/50 via-rose-100/30 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-lora text-xl text-rose-700">
                  Family Members
                </CardTitle>
                <CardDescription>
                  All approved family members
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{stats?.members.approved || 0}</span> members
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isMembersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <MemberSkeletonCard key={index} />
                ))}
              </div>
            ) : isMembersError ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">Failed to load members</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            ) : allMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No members found</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {allMembers.map((member: FamilyMemberWithUser, index: number) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      key={member.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-gray-50/80 hover:bg-rose-50/50 transition-all border border-gray-100/50 group"
                    >
                      <div className="relative">
                        <img
                          src={
                            member.user.imageUrl ||
                            "/placeholder-avatar.png"
                          }
                          alt={member.user.fullName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-rose-100 transition-colors"
                        />
                        {member.role === "ADMIN" && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 w-4 h-4 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm group-hover:text-rose-600 transition-colors">
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
                          <span className="capitalize">{member.role.toLowerCase()}</span>
                          {member.user.username && (
                            <>
                              <span>•</span>
                              <span>@{member.user.username}</span>
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
                                  className="gap-2 hover:bg-rose-50 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Profile
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
                  ))}
                </AnimatePresence>

                {/* Load More Trigger */}
                <div ref={loadMoreRef} className="pt-4 flex justify-center">
                  {isFetchingNextPage ? (
                    <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                  ) : hasNextPage ? (
                    <span className="text-gray-500 text-sm">Loading more members...</span>
                  ) : (
                    <span className="flex items-center gap-2 text-sm text-rose-600 px-4 py-2 bg-rose-50 rounded-full border border-rose-200 shadow-sm">
                      <Users className="w-4 h-4" />
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
