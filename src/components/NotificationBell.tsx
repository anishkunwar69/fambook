"use client";

import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Notification = {
  id: string;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const { data: notifications, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data as Notification[];
    },
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      refetch();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
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
        return "📬";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-rose-50"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center"
              >
                {unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-white/80 backdrop-blur-md"
      >
        <div className="p-4 border-b">
          <h3 className="font-lora font-bold text-gray-800">Notifications</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications?.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications yet
            </div>
          ) : (
            notifications?.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 border-b last:border-none hover:bg-rose-50/50 transition-colors cursor-pointer",
                  !notification.read && "bg-rose-50/30"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">
                      {notification.content}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(
                        new Date(notification.createdAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-rose-500 rounded-full mt-1" />
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 