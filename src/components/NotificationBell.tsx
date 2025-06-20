"use client";

import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Notification = {
  id: string;
  read: boolean;
};

export default function NotificationBell() {
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      const result = await response.json();
      if (!result.success) {
        throw new Error("Failed to fetch notifications");
      }
      return result.data as Notification[];
    },
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <Link href="/notifications">
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
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </Link>
  );
} 