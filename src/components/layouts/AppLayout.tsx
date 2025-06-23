"use client";

import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Heart,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  Menu,
  TreePine,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import BottomNavBar from "./BottomNavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true); // Default open for desktop
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Mobile overlay state
  const pathname = usePathname();
  const router = useRouter();

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
    { icon: TreePine, label: "Tree", href: `/roots` },
    {
      icon: User,
      label: "Profile",
      href: currentUser?.id ? `/profile/${currentUser.id}` : "/profile",
      isLoading: isUserLoading,
      disabled: isUserLoading,
    },
  ];

  // Always show all navigation items
  const navigationItems = baseNavigationItems;

  const handleMobileLinkClick = () => {
    setIsMobileSidebarOpen(false); // Close mobile sidebar when link is clicked
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white">
      <div className="flex">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
          )}
        </AnimatePresence>

        {/* Desktop Sidebar - Always visible on desktop */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`${
            isSidebarOpen ? "w-64" : "w-20"
          } bg-white/95 backdrop-blur-md min-h-screen border-r transition-all duration-300 fixed top-0 left-0 z-30 hidden lg:block`}
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
                const isProfileLoading =
                  item.isLoading && item.label === "Profile";

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
                      isDisabled
                        ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-600"
                        : ""
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
                            <span className="text-xs text-gray-400 ml-1">
                              Loading...
                            </span>
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
                    {!isSidebarOpen &&
                      item.hasNotification &&
                      item.label === "Events" && (
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

        {/* Mobile Sidebar - Only visible as overlay on mobile */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "tween", duration: 0.3 }}
              className="lg:hidden w-64 bg-white/95 backdrop-blur-md min-h-screen border-r fixed top-0 left-0 z-50"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileSidebarOpen(false)}
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </Button>
                  {/* Notification Bell */}
                  <div className="mr-2">
                    <NotificationBell />
                  </div>
                </div>

                <nav className="space-y-2">
                  {navigationItems.map((item) => {
                    const isDisabled = item.disabled;
                    const isProfileLoading =
                      item.isLoading && item.label === "Profile";

                    return (
                      <Link
                        key={item.label}
                        href={isDisabled ? "#" : item.href}
                        onClick={handleMobileLinkClick}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                          pathname === item.href
                            ? "bg-rose-50 text-rose-600"
                            : "text-gray-600 hover:bg-rose-50 hover:text-rose-600"
                        } ${
                          item.hasNotification && item.label === "Events"
                            ? "bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 shadow-sm"
                            : ""
                        } ${
                          isDisabled
                            ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-600"
                            : ""
                        }`}
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

                        <div className="flex items-center justify-between flex-1">
                          <span className="font-medium">
                            {item.label}
                            {isProfileLoading && (
                              <span className="text-xs text-gray-400 ml-1">
                                Loading...
                              </span>
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
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main
          className={`transition-all duration-300 flex-1 relative ${
            isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
          } ${pathname.includes("/roots") ? "pb-4 lg:pb-0" : "pb-20 lg:pb-0"} safe-area-inset-bottom`}
        >
          {pathname.includes("/roots") && pathname.includes("/families") ? (
            <>
              <div className="lg:hidden absolute sm:top-4 top-[25px] left-4 z-30">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="backdrop-blur-sm rounded-full border h-10 w-10"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Button>
              </div>
              <div className="p-0">{children}</div>
            </>
          ) : (
            <div className="bg-amber-50">
              {/* Mobile Notification Bell - Only visible on mobile */}
              {!pathname.includes("/notifications") && (
                <div className="lg:hidden absolute sm:top-[24px] top-[18px] right-7 z-30">
                  <NotificationBell />
                </div>
              )}
              {children}
            </div>
          )}
        </main>

        {/* Bottom Navigation Bar for Mobile */}
        <BottomNavBar navigationItems={navigationItems} />
      </div>
    </div>
  );
}
