"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import {
  Calendar,
  Heart,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  TreePine,
  User,
  Users,
} from "lucide-react";

type NavigationItem = {
  icon: any;
  label: string;
  href: string;
  hasNotification?: boolean;
  count?: number;
  disabled?: boolean;
  isLoading?: boolean;
};

export default function BottomNavBar({
  navigationItems,
}: {
  navigationItems: NavigationItem[];
}) {
  const pathname = usePathname();

  // Select the main navigation items for the bottom bar
  // We'll show Dashboard, Families, Feed, Albums, Tree and Events
  const mainItems = [
    navigationItems.find(item => item.label === "Dashboard"),
    navigationItems.find(item => item.label === "Families"),
    navigationItems.find(item => item.label === "Feed"),
    navigationItems.find(item => item.label === "Albums"),
    navigationItems.find(item => item.label === "Tree"),
  ].filter(Boolean) as NavigationItem[];

  // Get the Events item separately to handle notifications
  const eventsItem = navigationItems.find(item => item.label === "Events");

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        mass: 1
      }}
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-40 px-1 py-1 bottom-nav-safe-area"
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {mainItems.map((item) => {
          const isActive = pathname === item.href;
          const isDisabled = item.disabled;

          return (
            <Link
              key={item.label}
              href={isDisabled ? "#" : item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 relative group ${
                isActive
                  ? "text-rose-600"
                  : "text-gray-500 hover:text-rose-600"
              } ${
                isDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-rose-50/50"
              }`}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault();
                }
              }}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 ${isActive ? "text-rose-600" : "text-gray-500"} transition-transform duration-200 group-hover:scale-110`} />
                {item.hasNotification && (
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
                    className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"
                  />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-rose-600" : "text-gray-500"}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-0 w-10 h-1 bg-rose-500 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}

        {/* Events with notification */}
        {eventsItem && (
          <Link
            href={eventsItem.href}
                         className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 relative group ${
               pathname === eventsItem.href
                 ? "text-rose-600"
                 : "text-gray-500 hover:text-rose-600"
             } hover:bg-rose-50/50`}
          >
            <div className="relative">
              <Calendar className={`w-5 h-5 ${pathname === eventsItem.href ? "text-rose-600" : "text-gray-500"} transition-transform duration-200 group-hover:scale-110`} />
              {eventsItem.hasNotification && (
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
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full ring-2 ring-white"
                />
              )}
            </div>
            <span className={`text-[10px] mt-1 font-medium flex items-center gap-0.5 ${pathname === eventsItem.href ? "text-rose-600" : "text-gray-500"}`}>
              Events
              {eventsItem.hasNotification && eventsItem.count && (
                <motion.span
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="inline-flex items-center justify-center bg-rose-100 text-rose-600 text-[8px] font-bold rounded-full h-3.5 min-w-3.5 px-0.5"
                >
                  {eventsItem.count > 9 ? "9+" : eventsItem.count}
                </motion.span>
              )}
            </span>
            {pathname === eventsItem.href && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute bottom-0 w-10 h-1 bg-rose-500 rounded-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        )}

        {/* Profile Link */}
        <Link
          href={navigationItems.find(item => item.label === "Profile")?.href || "/profile"}
                     className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 group ${
              pathname.includes("/profile")
                ? "text-rose-600"
                : "text-gray-500 hover:text-rose-600"
            } hover:bg-rose-50/50`}
        >
                      <User className={`w-5 h-5 ${pathname.includes("/profile") ? "text-rose-600" : "text-gray-500"} transition-transform duration-200 group-hover:scale-110`} />
          <span className={`text-[10px] mt-1 font-medium ${pathname.includes("/profile") ? "text-rose-600" : "text-gray-500"}`}>
            Profile
          </span>
          {pathname.includes("/profile") && (
            <motion.div
              layoutId="bottomNavIndicator"
              className="absolute bottom-0 w-10 h-1 bg-rose-500 rounded-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </Link>
      </div>
    </motion.div>
  );
} 