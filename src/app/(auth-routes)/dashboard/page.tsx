"use client";

import { ProfileCompletionPrompt } from "@/components/onboarding/ProfileCompletionPrompt";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ChevronRight, Home, PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user } = useUser();
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // Check if this is the first login
  useEffect(() => {
    const hasVisitedDashboard = localStorage.getItem("has_visited_dashboard");

    if (!hasVisitedDashboard) {
      setIsFirstLogin(true);
      localStorage.setItem("has_visited_dashboard", "true");
    }
  }, []);

  // Prepare profile data for the completion prompt
  const profileData = {
    userId: user?.id || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    profileImage: user?.imageUrl,
    coverImage: null,
    dateOfBirth: null,
    bio: null,
    currentPlace: null,
    relationshipStatus: null,
    languages: null,
  };

  return (
    <div className="p-8">
      {/* Profile Completion Prompt - only show when user data is loaded */}
      {user && !isUserLoading && (
        <ProfileCompletionPrompt
          profileData={profileData}
          isFirstLogin={isFirstLogin}
        />
      )}

      {/* Breadcrumb Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-6"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-rose-500 font-medium">Dashboard</span>
      </motion.div>

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-lora font-bold text-gray-800">
          Welcome,{" "}
          {isUserLoading ? (
            <span className="inline-flex items-center gap-2">
              <span>User</span>
            </span>
          ) : (
            user?.firstName || "there"
          )}
          ! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Start your family journey by creating or joining a family
        </p>
      </motion.div>

      {/* Main Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      >
        {/* Create Family Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-rose-100 hover:border-rose-200 transition-all"
        >
          <div className="bg-rose-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <PlusCircle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="font-lora text-xl font-bold text-gray-800 mb-2">
            Create a Family
          </h3>
          <p className="text-gray-600 mb-4">
            Start your own family space and invite your loved ones
          </p>
          <Link href="/families/create">
            <Button className="bg-rose-500 hover:bg-rose-600 w-full">
              Create Family
            </Button>
          </Link>
        </motion.div>

        {/* Join Family Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-amber-100 hover:border-amber-200 transition-all"
        >
          <div className="bg-amber-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="font-lora text-xl font-bold text-gray-800 mb-2">
            Join a Family
          </h3>
          <p className="text-gray-600 mb-4">
            Enter an invite code to join your family's space
          </p>
          <Link href="/families/join">
            <Button variant="outline" className="w-full">
              Join Family
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Quick Stats or Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg"
      >
        <h3 className="font-lora text-xl font-bold text-gray-800 mb-4">
          Getting Started
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-gray-600">
            <PlusCircle className="w-5 h-5 text-rose-500" />
            <span>Create your first family space</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Users className="w-5 h-5 text-rose-500" />
            <span>Invite family members</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
