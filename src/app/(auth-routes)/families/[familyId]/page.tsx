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
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronRight,
  Clock,
  Home,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  Shield,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

  const isAdmin = family?.members.some(
    (member: FamilyMember) =>
      member.userId === family.currentUserId && member.role === "ADMIN"
  );

  const isLoading = isFamilyLoading || isStatsLoading;

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
      {!isLoading && family && (
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
      )}

      {/* Admin Actions with enhanced interactivity */}
      {isAdmin && family && (
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
                  Manage your family settings and member requests
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

              {/* Family Settings Card */}
              <Link href={`/families/${familyId}/settings`}>
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/80 backdrop-blur-md rounded-lg p-4 border border-amber-100/50 transition-all duration-300 hover:border-amber-300 hover:shadow-lg group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-50 w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <Settings className="w-5 h-5 text-amber-500" />
                      </motion.div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 group-hover:text-amber-600 transition-colors">
                        Family Settings
                      </h4>
                      <p className="text-sm text-gray-500">
                        Manage family preferences
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Link>

              {/* Member Management Card */}
              <Link href={`/families/${familyId}/members`}>
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/80 backdrop-blur-md rounded-lg p-4 border border-amber-100/50 transition-all duration-300 hover:border-amber-300 hover:shadow-lg group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-50 w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 group-hover:text-amber-600 transition-colors">
                        Members
                      </h4>
                      <p className="text-sm text-gray-500">
                        Manage family members
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content with enhanced loading state */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <motion.div 
              className="relative"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-12 h-12 border-4 border-rose-100 rounded-full animate-spin border-t-rose-500" />
              <motion.div 
                className="w-12 h-12 border-4 border-amber-100 rounded-full absolute inset-0"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </div>
        ) : !family ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-600 p-8 bg-white/80 rounded-2xl border border-rose-100/50"
          >
            Family not found
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Family Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Members Info Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/80 backdrop-blur-md border-rose-100/50 overflow-hidden">
                  <CardHeader className="border-b border-rose-100/20 bg-gradient-to-r from-rose-50/50 via-rose-100/30 to-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-lora text-xl text-rose-700">
                          Members
                        </CardTitle>
                        <CardDescription>
                          Family member information
                        </CardDescription>
                      </div>
                      <Link href={`/families/${familyId}/members`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Active Members */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="bg-gradient-to-br from-rose-50/80 to-rose-100/30 rounded-lg p-4 border border-rose-200/50 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-rose-100 rounded-full p-2">
                            <UserCheck className="w-5 h-5 text-rose-500" />
                          </div>
                          <span className="font-medium text-gray-800">
                            Active
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-rose-500">
                          {stats?.members.approved || 0}
                        </div>
                        <p className="text-sm text-gray-600">
                          Approved members
                        </p>
                      </motion.div>

                      {/* Pending Members */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="bg-gradient-to-br from-amber-50/80 to-amber-50/40 rounded-lg p-4 border border-amber-100/50 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-amber-100 rounded-full p-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                          </div>
                          <span className="font-medium text-gray-800">
                            Pending
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-amber-500">
                          {stats?.members.pending || 0}
                        </div>
                        <p className="text-sm text-gray-600">
                          Awaiting approval
                        </p>
                      </motion.div>
                    </div>

                    {/* Recent Members */}
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-800 mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          Recent Members
                        </div>
                        <span className="text-sm text-gray-500">
                          {family.members.length}{" "}
                          {family.members.length === 1 ? "member" : "members"}
                        </span>
                      </h4>
                      <div className="relative">
                        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rose-200 scrollbar-track-gray-50 hover:scrollbar-thumb-rose-300">
                          {family.members.map((member, index) => (
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              key={member.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80 hover:bg-rose-50/50 transition-all border border-gray-100/50 group"
                            >
                              <div className="relative">
                                <img
                                  src={
                                    member.user.imageUrl ||
                                    "/placeholder-avatar.png"
                                  }
                                  alt={member.user.fullName}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-rose-100 transition-colors"
                                />
                                {member.role === "ADMIN" && (
                                  <div className="absolute -top-1 -right-1 bg-amber-500 w-4 h-4 rounded-full border-2 border-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 text-sm group-hover:text-rose-600 transition-colors">
                                  {member.user.fullName}
                                </p>
                                <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      member.role === "ADMIN"
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                    }`}
                                  />
                                  {member.role.toLowerCase()}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        <div className="absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Family Activity Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-white/80 backdrop-blur-md border-rose-100/50 overflow-hidden">
                  <CardHeader className="border-b border-rose-100/20 bg-gradient-to-r from-rose-50/50 via-rose-100/30 to-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-lora text-xl text-rose-700">
                          Family Activity
                        </CardTitle>
                        <CardDescription>
                          Recent content and engagement
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Posts Activity */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="bg-gradient-to-br from-rose-50/80 to-rose-100/30 rounded-lg p-4 border border-rose-200/50 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-rose-100 rounded-full p-2">
                            <MessageSquare className="w-5 h-5 text-rose-500" />
                          </div>
                          <span className="font-medium text-gray-800">
                            Posts Activity
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            {
                              label: "Last 24h",
                              value: stats?.content.posts.last24Hours,
                            },
                            {
                              label: "This Week",
                              value: stats?.content.posts.lastWeek,
                            },
                            {
                              label: "This Month",
                              value: stats?.content.posts.lastMonth,
                            },
                          ].map((item, index) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="text-center"
                            >
                              <div className="text-2xl font-bold text-rose-500">
                                {item.value || 0}
                              </div>
                              <p className="text-xs text-gray-600">
                                {item.label}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Albums & Media */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="bg-gradient-to-br from-rose-50/80 to-rose-100/30 rounded-lg p-4 border border-rose-200/50 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-rose-100 rounded-full p-2">
                            <ImageIcon className="w-5 h-5 text-rose-500" />
                          </div>
                          <span className="font-medium text-gray-800">
                            Albums & Media
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-rose-500">
                              {stats?.content.albums.total || 0}
                            </div>
                            <p className="text-xs text-gray-600">
                              Total Albums
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-rose-500">
                              {stats?.content.albums.totalMedia || 0}
                            </div>
                            <p className="text-xs text-gray-600">Total Media</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Upcoming Events */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="bg-gradient-to-br from-rose-50/80 to-rose-100/30 rounded-lg p-4 border border-rose-200/50 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-rose-100 rounded-full p-2">
                            <Calendar className="w-5 h-5 text-rose-500" />
                          </div>
                          <span className="font-medium text-gray-800">
                            Upcoming Events
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-3xl font-bold text-rose-500">
                            {stats?.content.events.upcoming || 0}
                          </div>
                          <p className="text-sm text-gray-600">
                            {stats?.content.events.upcoming === 0
                              ? "No upcoming events"
                              : stats?.content.events.upcoming === 1
                                ? "Upcoming event"
                                : "Upcoming events"}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
