"use client";

import { LifeTimeline } from "@/components/profile/LifeTimeline";
import MemoriesGallery from "@/components/profile/MemoriesGallery";
import PersonalDetails from "@/components/profile/PersonalDetails";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import {
  TabName,
  TabVisibilitySettings,
} from "@/components/profile/TabVisibilitySettings";
import { UserPostsTab } from "@/components/profile/UserPostsTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ChevronRight,
  Home,
  Loader2,
  Lock,
  Settings,
  Shield,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function BasicLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-rose-500" />
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">
            Loading profile...
          </p>
          <p className="text-sm text-gray-500">Please wait a moment.</p>
        </div>
      </div>
    </div>
  );
}

function PrivateContentMessage({ tabName }: { tabName: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white/80 backdrop-blur-md rounded-2xl p-12 text-center border border-rose-100/50 min-h-[300px]">
      <div className="bg-rose-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Lock className="w-8 h-8 text-rose-500" />
      </div>
      <h3 className="text-xl font-lora font-bold text-gray-800 mb-2">
        Content is Private
      </h3>
      <p className="text-gray-600 max-w-md mx-auto">
        This user has chosen to make their &apos;{tabName}&apos; tab visible
        only to certain family members.
      </p>
    </div>
  );
}

// User Not Found Component
function UserNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border">
          {/* Icon */}
          <div className="relative mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
              <UserX className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-rose-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500" />
            </div>
          </div>

          {/* Content */}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
            User Not Found
          </h1>
          <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
            We couldn't find a user with this profile. They may have deactivated
            their account or the link might be incorrect.
          </p>

          {/* Actions */}
          <div className="space-y-2 sm:space-y-3">
            <Link href="/dashboard">
              <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white">
                Return to Dashboard
              </Button>
            </Link>
            <Link href="/families">
              <Button variant="outline" className="w-full">
                Browse Families
              </Button>
            </Link>
          </div>

          {/* Help text */}
          <p className="text-xs text-gray-500 mt-4 sm:mt-6">
            Need help? Contact support if you believe this is an error.
          </p>
        </div>
      </div>
    </div>
  );
}

// Types for profile data
interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startYear: number;
  endYear: number | null;
  description: string | null;
}

interface WorkHistory {
  id: string;
  company: string;
  position: string;
  startYear: number;
  endYear: number | null;
  currentlyWorking: boolean;
  location: string | null;
  description: string | null;
}

interface FamilyMembership {
  familyId: string;
  familyName: string;
  joinedAt: string | Date;
  role: string;
}

interface FamilyOption {
  id: string;
  name: string;
}

// Component implementation
export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(tabParam || "details"); // Changed default to details
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UI state
  const [isPrivacyDialogOpen, setIsPrivacyDialogOpen] = useState(false);
  const [activePrivacyTab, setActivePrivacyTab] = useState<TabName | undefined>(
    undefined
  );

  // Track initial renders
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Get current user data
  const {
    user: currentUser,
    isLoading: isUserLoading,
    error: userError,
  } = useCurrentUser();

  // Fetch profile data
  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/profile`);
      if (response.status === 404) {
        throw new Error("USER_NOT_FOUND");
      }
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
  });

  // Fetch tab visibility settings
  const {
    data: visibilityData,
    isLoading: isVisibilityLoading,
    refetch: refetchVisibility,
  } = useQuery({
    queryKey: ["tabVisibility", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/profile/tab-visibility`);
      if (!res.ok) {
        throw new Error("Failed to fetch tab visibility settings");
      }
      const json = await res.json();
      return json.data;
    },
    enabled: !profileError, // Only fetch if profile exists
  });

  // Determine if this is the user's own profile
  const isSelf = useMemo(() => {
    if (visibilityData?.isCurrentUser) return true;
    return Boolean(currentUser?.id === userId);
  }, [currentUser?.id, userId, visibilityData?.isCurrentUser]);

  // Prepare tab visibility settings
  const tabVisibility = useMemo(() => {
    return (
      visibilityData?.tabVisibility || {
        memories: "everyone",
        timeline: "everyone",
        details: "everyone",
        posts: "everyone",
      }
    );
  }, [visibilityData]);

  // Get user's families
  const families: FamilyOption[] = useMemo(() => {
    return visibilityData?.families || [];
  }, [visibilityData]);

  // Get viewer's family IDs (from tab visibility API)
  const viewerFamilyIds = useMemo(() => {
    return visibilityData?.viewerFamilyIds || [];
  }, [visibilityData]);

  // Check tab visibility
  const isTabVisible = (tabName: TabName): boolean => {
    // Owner can always see all tabs
    if (isSelf) {
      return true;
    }

    // Default to visible if settings not loaded
    if (!tabVisibility) {
      return true;
    }

    const visibility = tabVisibility[tabName];

    // Everyone can see this tab
    if (visibility === "everyone") {
      return true;
    }

    // Check if user is in the required family
    const canSeeTab = viewerFamilyIds.includes(visibility);
    return canSeeTab;
  };

  const isMemoriesVisible = isTabVisible("memories");
  const isTimelineVisible = isTabVisible("timeline");
  const isDetailsVisible = isTabVisible("details");
  const isPostsVisible = isTabVisible("posts");

  // Extract profile data
  const profile = profileData?.data?.user || {};
  const education = profileData?.data?.education || [];
  const workHistory = profileData?.data?.workHistory || [];
  const familyMemberships = profileData?.data?.familyMemberships || [];

  // Debug what we get from API
  console.log("Profile Page - API Data:", {
    relationshipStatus: profile.relationshipStatus,
    relationshipType: typeof profile.relationshipStatus,
    fullProfile: profile,
  });

  // Format data for ProfileHeader
  const headerProfileData = {
    profileImage: profile.profileImage,
    coverImage: profile.coverImage,
    firstName: profile.firstName,
    lastName: profile.lastName,
    fullName: profile.fullName,
    dateOfBirth: profile.dateOfBirth,
    birthPlace: profile.birthPlace,
    currentPlace: profile.currentPlace,
    relationshipStatus: profile.relationshipStatus,
    bio: profile.bio || profile.biography,
    isBirthday: profile.isBirthday,
    age: profile.age,
    role: familyMemberships[0]?.role,
    languages: profile.languages || [],
  };

  console.log("Profile Page - Header Data Being Passed:", {
    relationshipStatus: headerProfileData.relationshipStatus,
    relationshipType: typeof headerProfileData.relationshipStatus,
  });

  // Format data for family info
  const headerFamilyData = {
    memberSince: familyMemberships[0]?.joinedAt
      ? new Date(familyMemberships[0].joinedAt)
      : new Date(),
    familyName: familyMemberships[0]?.familyName || "Your Family",
    familyId: familyMemberships[0]?.familyId,
    totalConnectedFamilies: familyMemberships.length,
    relationshipCount: 0,
  };

  // Format data for PersonalDetails
  const personalDetailsData = {
    bio: profile.bio || profile.biography,
    birthPlace: profile.birthPlace,
    currentPlace: profile.currentPlace,
    languages: profile.languages || [],
    relationshipStatus: profile.relationshipStatus,
    education: education.map((edu: any) => ({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startYear: edu.startYear,
      endYear: edu.endYear,
      description: edu.description,
    })),
    work: workHistory.map((work: any) => ({
      id: work.id,
      company: work.company,
      position: work.position,
      startYear: work.startYear,
      endYear: work.endYear,
      currentlyWorking: work.currentlyWorking,
      location: work.location,
      description: work.description,
    })),
    interests: profile.interests || [],
    customFields: {},
  };

  // Mutation to update tab visibility settings
  const updateTabVisibility = async (
    settings: Record<TabName, string>
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/users/${userId}/profile/tab-visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error("Failed to update tab visibility settings");
      }

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Privacy settings updated",
          description: "Your tab visibility settings have been saved.",
        });
        refetchVisibility();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating tab visibility:", error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const refreshProfileData = () => {
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  };

  // Dialog control functions
  const openPrivacyDialog = (tab?: TabName) => {
    setActivePrivacyTab(tab);
    setIsPrivacyDialogOpen(true);
  };

  const closePrivacyDialog = () => {
    setIsPrivacyDialogOpen(false);
    setActivePrivacyTab(undefined);
  };

  // Tab privacy indicator
  const renderTabPrivacyIndicator = (tabName: TabName) => {
    if (!isSelf || !tabVisibility) return null;

    const visibility = tabVisibility[tabName];
    const isPrivate = visibility !== "everyone";

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex ml-1 opacity-70 hover:opacity-100 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                openPrivacyDialog(tabName);
              }}
            >
              <Shield className={`h-3.5 w-3.5 text-gray-400`} />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isPrivate
                ? `Only ${families.find((f) => f.id === visibility)?.name || "specific family"} can see this tab`
                : "Everyone can see this tab"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Handle URL tab parameter changes
  useEffect(() => {
    if (
      tabParam &&
      ["memories", "timeline", "details", "posts"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Show user fetch error
  useEffect(() => {
    if (userError) {
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      });
    }
  }, [userError, toast]);

  // Debug visibility info
  useEffect(() => {
    if (visibilityData) {
      console.log("Tab Visibility (Frontend):", {
        tabVisibility,
        isSelf,
        viewerFamilyIds,
        tabSettings: visibilityData.tabVisibility,
      });
    }
  }, [visibilityData, tabVisibility, isSelf, viewerFamilyIds]);

  // NOW WE CAN DO CONDITIONAL RETURNS AFTER ALL HOOKS ARE CALLED

  // Check if user not found
  if (profileError?.message === "USER_NOT_FOUND") {
    return <UserNotFound />;
  }

  // Loading state
  if (isUserLoading || isProfileLoading || isVisibilityLoading) {
    return <BasicLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8 pb-8 sm:pb-11 max-lg:pb-20">
      <div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-gray-500 mb-6 mt-[8px]"
        >
          <Link
            href="/"
            className="hover:text-rose-500 transition-colors flex items-center"
          >
            <Home className="w-3.5 h-3.5 mr-1" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-rose-500 font-medium">
            {isSelf ? "Your Profile" : profile.fullName}
          </span>
        </motion.div>
        <ProfileHeader
          userId={userId}
          isCurrentUser={isSelf}
          profileData={headerProfileData}
          familyData={headerFamilyData}
        />
      </div>

      <div className="mt-4 sm:mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col items-center md:flex-row md:items-center justify-between gap-4 mb-2">
            <TabsList className="flex w-full md:justify-start h-10 sm:h-12 bg-transparent rounded-none p-0 md:overflow-x-auto">
              <TabsTrigger
                value="details"
                className="flex flex-1 md:flex-none justify-center items-center data-[state=active]:border-rose-500 rounded-none border-b-2 border-transparent text-sm sm:text-base md:whitespace-nowrap px-3 sm:px-4"
              >
                <span className="flex items-center gap-1 sm:gap-2">
                  <span className="hidden sm:inline">Personal Details</span>
                  <span className="sm:hidden">Details</span>
                  {renderTabPrivacyIndicator("details")}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="memories"
                className="flex flex-1 md:flex-none justify-center items-center data-[state=active]:border-rose-500 rounded-none border-b-2 border-transparent text-sm sm:text-base md:whitespace-nowrap px-3 sm:px-4"
              >
                <span className="flex items-center gap-1 sm:gap-2">
                  Memories
                  {renderTabPrivacyIndicator("memories")}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="flex flex-1 md:flex-none justify-center items-center data-[state=active]:border-rose-500 rounded-none border-b-2 border-transparent text-sm sm:text-base md:whitespace-nowrap px-3 sm:px-4"
              >
                <span className="flex items-center gap-1 sm:gap-2">
                  <span className="hidden sm:inline">Life Timeline</span>
                  <span className="sm:hidden">Timeline</span>
                  {renderTabPrivacyIndicator("timeline")}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="posts"
                className="flex flex-1 md:flex-none justify-center items-center data-[state=active]:border-rose-500 rounded-none border-b-2 border-transparent text-sm sm:text-base md:whitespace-nowrap px-3 sm:px-4"
              >
                <span className="flex items-center gap-1 sm:gap-2">
                  Posts
                  {renderTabPrivacyIndicator("posts")}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Privacy Settings Button */}
            {isSelf && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm border w-full md:w-auto"
                      onClick={() => openPrivacyDialog()}
                    >
                      <Settings className="h-3 w-3 md:h-4 md:w-4" />
                      <span>Privacy</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Control who can see your profile tabs</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="mt-4 sm:mt-6">
            <TabsContent value="details">
              {isDetailsVisible ? (
                <PersonalDetails
                  userId={userId}
                  isCurrentUser={isSelf}
                  personalDetails={personalDetailsData}
                  onPersonalDetailsUpdated={refreshProfileData}
                />
              ) : (
                <PrivateContentMessage tabName="Personal Details" />
              )}
            </TabsContent>

            <TabsContent value="memories">
              {isMemoriesVisible ? (
                <MemoriesGallery userId={userId} isCurrentUser={isSelf} />
              ) : (
                <PrivateContentMessage tabName="Memories" />
              )}
            </TabsContent>

            <TabsContent value="timeline">
              {isTimelineVisible ? (
                <LifeTimeline userId={userId} isCurrentUser={isSelf} />
              ) : (
                <PrivateContentMessage tabName="Life Timeline" />
              )}
            </TabsContent>

            <TabsContent value="posts">
              {isPostsVisible ? (
                <UserPostsTab userId={userId} isCurrentUser={isSelf} />
              ) : (
                <PrivateContentMessage tabName="Posts" />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Tab Visibility Settings Dialog */}
      {isSelf && tabVisibility && (
        <TabVisibilitySettings
          userId={userId}
          isOpen={isPrivacyDialogOpen}
          onClose={closePrivacyDialog}
          initialSettings={tabVisibility}
          families={families}
          onSave={updateTabVisibility}
          activeTab={activePrivacyTab}
        />
      )}
    </div>
  );
}
