"use client";

import { LifeTimeline } from "@/components/profile/LifeTimeline";
import MemoriesGallery from "@/components/profile/MemoriesGallery";
import PersonalDetails from "@/components/profile/PersonalDetails";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import {
  TabName,
  TabVisibilitySettings,
} from "@/components/profile/TabVisibilitySettings";
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
import { AlertCircle, Settings, Shield, UserX } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { UserPostsTab } from "@/components/profile/UserPostsTab";

// Loading Skeleton Component
function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 animate-pulse">
      {/* Header Skeleton */}
      <div className="relative">
        {/* Cover Image Skeleton */}
        <div className="h-80 bg-gray-200 w-full"></div>

        {/* Profile Content Skeleton */}
        <div className="container mx-auto px-4 relative">
          <div className="bg-white rounded-t-3xl shadow-xl -mt-16 relative z-10 p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Profile Image Skeleton */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-gray-200 rounded-full border-4 border-white shadow-lg"></div>
              </div>

              {/* Profile Info Skeleton */}
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-64"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-16 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-6">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-36"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="h-6 bg-gray-200 rounded w-36 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// User Not Found Component
function UserNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 border">
          {/* Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
              <UserX className="w-10 h-10 text-gray-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            User Not Found
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            We couldn't find a user with this profile. They may have deactivated
            their account or the link might be incorrect.
          </p>

          {/* Actions */}
          <div className="space-y-3">
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
          <p className="text-xs text-gray-500 mt-6">
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
  startDate: string | Date;
  endDate: string | Date | null;
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

  // Check tab visibility (removed overview)
  const isTabVisible = (tabName: TabName): boolean => {
    // Owner can always see all tabs
    if (isSelf) {
      return true;
    }
    
    // Default to visible if settings not loaded
    if (!tabVisibility) {
      console.log(`Tab visibility settings not loaded for ${tabName}`);
      return true;
    }
    
    const visibility = tabVisibility[tabName];
    
    // Everyone can see this tab
    if (visibility === "everyone") {
      console.log(`Tab ${tabName} is visible to everyone`);
      return true;
    }
    
    // Check if user is in the required family
    const canSeeTab = viewerFamilyIds.includes(visibility);
    console.log(
      `Tab ${tabName} visible only to family ${visibility}, user can see: ${canSeeTab}`
    );
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
      startDate: work.startDate,
      endDate: work.endDate,
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

  // Tab privacy indicator (removed overview)
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
              <Shield
                className={`h-3.5 w-3.5 text-gray-400`}
              />
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
    if (tabParam && ["memories", "timeline", "details"].includes(tabParam)) {
      // Removed overview
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Handle URL tab parameter changes
  useEffect(() => {
    if (tabParam && ["memories", "timeline", "details", "posts"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Handle URL tab parameter changes
  useEffect(() => {
    if (tabParam && ["memories", "timeline", "details", "posts"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Handle URL tab parameter changes
  useEffect(() => {
    if (tabParam && ["memories", "timeline", "details", "posts"].includes(tabParam)) {
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

  // Reset to visible tab if current tab isn't visible (removed overview logic)
  useEffect(() => {
    if (isInitialLoad || isSelf) return;

    const isCurrentTabVisible =
      (activeTab === "memories" && isMemoriesVisible) ||
      (activeTab === "timeline" && isTimelineVisible) ||
      (activeTab === "details" && isDetailsVisible);

    if (!isCurrentTabVisible) {
      if (isDetailsVisible)
        setActiveTab("details"); // Details first priority
      else if (isMemoriesVisible) setActiveTab("memories");
      else if (isTimelineVisible) setActiveTab("timeline");
    }

    setIsInitialLoad(false);
  }, [
    activeTab,
    isSelf,
    isInitialLoad,
    isMemoriesVisible,
    isTimelineVisible,
    isDetailsVisible,
  ]);

  // Handle URL tab parameter changes
  useEffect(() => {
    if (tabParam && ["memories", "timeline", "details", "posts"].includes(tabParam)) {
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

  // Reset to visible tab if current tab isn't visible
  useEffect(() => {
    if (isInitialLoad || isSelf) return;

    const isCurrentTabVisible =
      (activeTab === "memories" && isMemoriesVisible) ||
      (activeTab === "timeline" && isTimelineVisible) ||
      (activeTab === "details" && isDetailsVisible) ||
      (activeTab === "posts" && isPostsVisible);

    if (!isCurrentTabVisible) {
      if (isDetailsVisible)
        setActiveTab("details"); // Details first priority
      else if (isPostsVisible) setActiveTab("posts");
      else if (isMemoriesVisible) setActiveTab("memories");
      else if (isTimelineVisible) setActiveTab("timeline");
    }

    setIsInitialLoad(false);
  }, [
    activeTab,
    isSelf,
    isInitialLoad,
    isMemoriesVisible,
    isTimelineVisible,
    isDetailsVisible,
    isPostsVisible,
  ]);

  // NOW WE CAN DO CONDITIONAL RETURNS AFTER ALL HOOKS ARE CALLED

  // Check if user not found
  if (profileError?.message === "USER_NOT_FOUND") {
    return <UserNotFound />;
  }

  // Loading state
  if (isUserLoading || isProfileLoading || isVisibilityLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-11">
      <ProfileHeader
        userId={userId}
        isCurrentUser={isSelf}
        profileData={headerProfileData}
        familyData={headerFamilyData}
      />

      <div className="container mx-auto px-4 mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-2">
            <TabsList className="w-full justify-start h-12 bg-transparent  rounded-none p-0">
              {isDetailsVisible && (
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:border-rose-500 rounded-none border-b-2 border-transparent"
                >
                  <span className="flex items-center">
                    Personal Details
                    {renderTabPrivacyIndicator("details")}
                  </span>
                </TabsTrigger>
              )}
              {isMemoriesVisible && (
                <TabsTrigger
                  value="memories"
                  className="data-[state=active]:border-rose-500 rounded-none border-b-2 border-transparent"
                >
                  <span className="flex items-center">
                    Memories
                    {renderTabPrivacyIndicator("memories")}
                  </span>
                </TabsTrigger>
              )}
              {isTimelineVisible && (
                <TabsTrigger
                  value="timeline"
                  className="data-[state=active]:border-rose-500 rounded-none border-b-2 border-transparent"
                >
                  <span className="flex items-center">
                    Life Timeline
                    {renderTabPrivacyIndicator("timeline")}
                  </span>
                </TabsTrigger>
              )}
              {isPostsVisible && (
                <TabsTrigger
                  value="posts"
                  className="data-[state=active]:border-rose-500 rounded-none border-b-2 border-transparent"
                >
                  <span className="flex items-center">
                    Post
                    {renderTabPrivacyIndicator("posts")}
                  </span>
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* visual separator */}

            {/* Privacy Settings Button */}
            {isSelf && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1.5 text-sm border"
                      onClick={() => openPrivacyDialog()}
                    >
                      <Settings className="h-4 w-4" />
                      Privacy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Control who can see your profile tabs</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="mt-6">
            {isDetailsVisible && (
              <TabsContent value="details">
                <PersonalDetails 
                  userId={userId}
                  isCurrentUser={isSelf}
                  personalDetails={personalDetailsData}
                  onPersonalDetailsUpdated={refreshProfileData}
                />
              </TabsContent>
            )}

            {isMemoriesVisible && (
              <TabsContent value="memories">
                <MemoriesGallery userId={userId} isCurrentUser={isSelf} />
              </TabsContent>
            )}

            {isTimelineVisible && (
              <TabsContent value="timeline">
                <LifeTimeline userId={userId} isCurrentUser={isSelf} />
              </TabsContent>
            )}

            {isPostsVisible && (
              <TabsContent value="posts">
                <UserPostsTab userId={userId} isCurrentUser={isSelf} />
              </TabsContent>
            )}
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
