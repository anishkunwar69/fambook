"use client";

import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Heart,
  Home,
  Image as ImageIcon,
  Menu,
  MessageSquare,
  Users,
  CalendarDays,
  User,
  Loader2,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  
  // Get current user for profile link
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();

  // Fetch upcoming events
  const { data: upcomingEvents } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const response = await fetch("/api/special-days?timeFrame=week");
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  const hasUpcomingEvents = upcomingEvents && upcomingEvents.length > 0;
  const upcomingEventsCount = upcomingEvents?.length || 0;

  // Base navigation items (always available)
  const baseNavigationItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Families", href: "/families" },
    { icon: Heart, label: "Feed", href: "/feed" },
    { icon: ImageIcon, label: "Albums", href: "/albums" },
    {
      icon: Calendar,
      label: "Events",
      href: "/events",
      hasNotification: hasUpcomingEvents,
      count: upcomingEventsCount,
    },
    { icon: MessageSquare, label: "Tree", href: `/roots` },
    { 
      icon: User, 
      label: "Profile", 
      href: currentUser?.id ? `/profile/${currentUser.id}` : "/profile",
      isLoading: isUserLoading,
      disabled: isUserLoading
    },
  ];

  // Always show all navigation items
  const navigationItems = baseNavigationItems;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white">
      <div className="flex">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`${
            isSidebarOpen ? "w-64" : "w-20"
          } bg-white/80 backdrop-blur-md min-h-screen border-r transition-all duration-300 fixed top-0 left-0 z-30`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </Button>
              {/* Notification Bell */}
              <div className={`${!isSidebarOpen && "hidden"} mr-2`}>
                <NotificationBell />
              </div>
            </div>

            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const isDisabled = item.disabled;
                const isProfileLoading = item.isLoading && item.label === "Profile";
                
                return (
                <Link
                  key={item.label}
                    href={isDisabled ? "#" : item.href}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                    pathname === item.href
                      ? "bg-rose-50 text-rose-600"
                      : "text-gray-600 hover:bg-rose-50 hover:text-rose-600"
                    } ${
                      item.hasNotification && item.label === "Events"
                        ? "bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 shadow-sm"
                        : ""
                    } ${
                      isDisabled ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-600" : ""
                    }`}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="relative">
                      {isProfileLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                  <item.icon className="w-5 h-5" />
                      )}
                      {/* Pulsing dot on icon for events */}
                      {item.hasNotification && item.label === "Events" && (
                        <motion.div
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [1, 0.7, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                        />
                      )}
                    </div>
                    
                  {isSidebarOpen && (
                      <div className="flex items-center justify-between flex-1">
                        <span className="font-medium">
                          {item.label}
                          {isProfileLoading && (
                            <span className="text-xs text-gray-400 ml-1">Loading...</span>
                  )}
                        </span>
                        
                        {/* Enhanced notification for Events */}
                        {item.hasNotification && item.label === "Events" && (
                          <AnimatePresence>
                            <motion.div
                              initial={{ scale: 0, x: 20 }}
                              animate={{ scale: 1, x: 0 }}
                              exit={{ scale: 0, x: 20 }}
                              className="flex items-center gap-1.5"
                            >
                              {/* Calendar icon with animation */}
                              <motion.div
                                animate={{
                                  rotate: [0, -5, 5, 0],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              >
                                <CalendarDays className="w-3.5 h-3.5 text-orange-600" />
                              </motion.div>
                              
                              {/* NEW badge */}
                              <motion.div
                                animate={{
                                  y: [0, -1, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                                className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm"
                              >
                                NEW
                              </motion.div>
                              
                              {/* Count badge */}
                              <motion.div
                                animate={{
                                  scale: [1, 1.1, 1],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                                className="bg-orange-100 text-orange-700 text-xs font-semibold px-1.5 py-0.5 rounded-full border border-orange-200"
                              >
                                {item.count}
                              </motion.div>
                            </motion.div>
                          </AnimatePresence>
                        )}
                      </div>
                    )}
                    
                    {/* Collapsed state notification */}
                    {!isSidebarOpen && item.hasNotification && item.label === "Events" && (
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg border-2 border-white"
                      >
                        {item.count > 9 ? "9+" : item.count}
                      </motion.div>
                  )}
                </Link>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-20"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
