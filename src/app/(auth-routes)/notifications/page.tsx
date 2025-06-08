"use client";

import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Home,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
};

// Skeleton components
function NotificationSkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/80 backdrop-blur-md rounded-xl p-4 md:p-6 border border-rose-100/50"
    >
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse shrink-0" />
        <div className="w-full">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      </div>
    </motion.div>
  );
}

function NotificationsPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 md:p-8">
      {/* Header Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-rose-100/50 mb-8"
      >
        <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:text-left sm:justify-between">
          <div>
            <div className="h-7 md:h-8 bg-gray-200 rounded animate-pulse w-48 mb-2 mx-auto sm:mx-0" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-64 md:w-80 mx-auto sm:mx-0" />
          </div>
          <div className="bg-gray-200 w-12 h-12 rounded-lg animate-pulse mx-auto sm:mx-0" />
        </div>
      </motion.div>
      {/* Cards Skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <NotificationSkeletonCard key={index} index={index} />
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notifications,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  // Mark a notification as read
  const {
    mutate: markAsRead,
    isPending: isMarkingAsRead,
    variables: markingNotificationId,
  } = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const getNotificationIcon = (type: string) => {
    // A simple icon mapping
    switch (type) {
      case "JOIN_REQUEST":
        return "👋";
      case "REQUEST_APPROVED":
        return "✅";
      case "REQUEST_REJECTED":
        return "❌";
      case "NEW_MEMBER":
        return "🎉";
      case "SPECIAL_DAY":
        return "🎂";
      default:
        return "🔔";
    }
  };

  if (isLoading) {
    return <NotificationsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 md:p-8">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-8 overflow-x-auto whitespace-nowrap"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-rose-500 font-medium">Notifications</span>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-rose-100/50 mb-8"
      >
         <div className="flex flex-col text-center gap-4 sm:flex-row sm:text-left sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-lora font-bold text-gray-800 mb-2">
              Your Notifications 🔔
            </h1>
            <p className="text-gray-600">
              Here's what you've missed. Click a notification to mark it as
              read.
            </p>
          </div>
          <div className="bg-rose-50 w-12 h-12 rounded-lg items-center justify-center shrink-0 mx-auto sm:mx-0 hidden md:flex">
            <Bell className="w-6 h-6 text-rose-500 hidden md:block" />
          </div>
        </div>
      </motion.div>

      {/* Error State */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50/50 rounded-2xl p-8 text-center border border-red-100/50"
        >
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-lora font-bold text-red-800">
            Failed to load notifications
          </h3>
          <p className="text-red-600 mb-6">{error.message}</p>
          <Button onClick={() => refetch()} variant="destructive">
            <Loader2
              className={cn("mr-2 h-4 w-4 animate-spin", !isLoading && "hidden")}
            />
            Try Again
          </Button>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && notifications?.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-12 text-center border border-rose-100/50"
        >
          <div className="bg-rose-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bell className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-xl font-lora font-bold text-gray-800 mb-2">
            All Caught Up!
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            You have no new notifications.
          </p>
        </motion.div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications?.map((notification, index) => {
          const isBeingMarkedAsRead =
            isMarkingAsRead && markingNotificationId === notification.id;

          return (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "bg-white/80 backdrop-blur-md rounded-xl p-4 md:p-6 border transition-all duration-300",
              !notification.read
                  ? "border-rose-200/70"
                : "border-rose-100/50",
                isBeingMarkedAsRead && "opacity-50"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                  <p className="font-medium text-gray-800">
                  {notification.content}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {format(
                      new Date(notification.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </span>
                </div>
              </div>
                <div className="ml-auto flex shrink-0 items-center self-center pl-4">
                  {!notification.read ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      disabled={isBeingMarkedAsRead}
                      className="w-[120px]"
                    >
                      {isBeingMarkedAsRead ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        "Mark as read"
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium w-[120px] justify-center">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Read</span>
                    </div>
                  )}
                </div>
            </div>
          </motion.div>
          );
        })}
      </div>
    </div>
  );
} 