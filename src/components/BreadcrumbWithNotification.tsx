"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import NotificationBell from "./NotificationBell";

type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: React.ReactNode;
};

type BreadcrumbWithNotificationProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function BreadcrumbWithNotification({ 
  items, 
  className = "mb-6 sm:mb-8 mt-[8px]" 
}: BreadcrumbWithNotificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between ${className}`}
    >
      <div className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="w-4 h-4 shrink-0" />}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-rose-500 transition-colors flex items-center gap-1"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="text-rose-500 font-medium flex items-center gap-1">
                {item.icon}
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="shrink-0">
        <NotificationBell />
      </div>
    </motion.div>
  );
} 