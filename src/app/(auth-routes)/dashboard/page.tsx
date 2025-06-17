"use client";

import { ProfileCompletionPrompt } from "@/components/onboarding/ProfileCompletionPrompt";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ChevronRight, Home, PlusCircle, Users, ChevronDown, ChevronUp, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user } = useUser();
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [hasFamilies, setHasFamilies] = useState<boolean | null>(null);
  const [isLoadingFamilies, setIsLoadingFamilies] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

  // Check if this is the first login and if user has families
  useEffect(() => {
    const hasVisitedDashboard = localStorage.getItem("has_visited_dashboard");
    const guideHidden = localStorage.getItem("dashboard_guide_hidden");

    if (!hasVisitedDashboard) {
      setIsFirstLogin(true);
      localStorage.setItem("has_visited_dashboard", "true");
    }

    if (guideHidden === "true") {
      setShowGuide(false);
    }

    // Check if user has any families
    const checkUserFamilies = async () => {
      setIsLoadingFamilies(true);
      try {
        const response = await fetch("/api/families");
        if (!response.ok) {
          throw new Error("Failed to fetch families");
        }
        const data = await response.json();
        setHasFamilies(data?.families?.length > 0);
      } catch (error) {
        console.error("Error fetching user families:", error);
        setHasFamilies(false);
      } finally {
        setIsLoadingFamilies(false);
      }
    };

    if (currentUser && !isUserLoading) {
      checkUserFamilies();
    }
  }, [currentUser, isUserLoading]);

  // Toggle guide visibility
  const toggleGuide = () => {
    const newState = !showGuide;
    setShowGuide(newState);
    localStorage.setItem("dashboard_guide_hidden", newState ? "false" : "true");
  };

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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8 max-lg:pb-20">
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
        className="flex items-center gap-2 text-sm text-gray-600 mb-6 mt-[8px]"
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
        id="welcome-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl sm:text-3xl font-lora font-bold text-gray-800">
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
        <p className="text-gray-600 mt-2 max-sm:text-xs">
          {hasFamilies 
            ? "Continue your family journey below" 
            : "Start your family journey by creating or joining a family"
          }
        </p>
      </motion.div>

      {/* Permanent Guide Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-100 rounded-xl p-4 sm:p-5 shadow-sm guide-card-glow">
          <div className="flex justify-between items-start">
            <div className="flex gap-3 items-start">
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2 sm:text-base text-sm">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                    Getting Started with Fambook
                  </span>
                  <button 
                    onClick={toggleGuide}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showGuide ? "Hide guide" : "Show guide"}
                  >
                    {showGuide ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </button>
                </h3>
                
                {showGuide && (
                  <div className="text-gray-600 text-sm space-y-3 mt-2 animate-fadeIn">
                    <p>
                      Welcome to Fambook! To use all features, you need to be part of a family. 
                      Here's how to get started:
                    </p>
                    <ul className="space-y-2 ml-1">
                      <li className="flex items-start gap-2">
                        <div className="min-w-[20px] mt-0.5">
                          <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500" />
                        </div>
                        <span>
                          <strong>Create a Family:</strong> Start your own family space where you can invite your loved ones and build your family tree.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="min-w-[20px] mt-0.5">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                        </div>
                        <span>
                          <strong>Join a Family:</strong> If someone has invited you, you can join their family by entering the invite code they shared with you.
                        </span>
                      </li>
                    </ul>
                    <p>
                      Once you create or join a family, you'll unlock all features of Fambook including family trees, shared albums, and more!
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => {
                setShowGuide(false);
                localStorage.setItem("dashboard_guide_hidden", "true");
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss guide"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 sm:gap-6 gap-4 mb-6"
      >
        {/* Create Family Card */}
        <motion.div
          id="create-family-card"
          whileHover={{ y: -5 }}
          className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-rose-100 hover:border-rose-200 transition-all"
        >
          <div className="bg-rose-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <PlusCircle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="font-lora sm:text-xl text-lg font-bold text-gray-800 mb-2">
            Create a Family
          </h3>
          <p className="text-gray-600 mb-4 max-sm:text-xs">
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
          id="join-family-card"
          whileHover={{ y: -5 }}
          className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-amber-100 hover:border-amber-200 transition-all"
        >
          <div className="bg-amber-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="font-lora sm:text-xl text-lg font-bold text-gray-800 mb-2">
            Join a Family
          </h3>
          <p className="text-gray-600 mb-4 max-sm:text-xs">
            Enter an invite code to join your family's space
          </p>
          <Link href="/families/join">
            <Button variant="outline" className="w-full">
              Join Family
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
