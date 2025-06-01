import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { TabName, TabVisibility, FamilyOption } from "@/components/profile/TabVisibilitySettings";

interface UseTabVisibilityProps {
  userId: string;
}

interface TabVisibilityResponse {
  tabVisibility: TabVisibility;
  families: FamilyOption[];
  isCurrentUser: boolean;
}

export const useTabVisibility = ({ userId }: UseTabVisibilityProps) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName | undefined>(undefined);

  // Fetch tab visibility settings
  const { data, isLoading, error } = useQuery<TabVisibilityResponse>({
    queryKey: ["tabVisibility", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/profile/tab-visibility`);
      if (!res.ok) {
        throw new Error("Failed to fetch tab visibility settings");
      }
      const json = await res.json();
      return json.data;
    },
  });

  // Mutation to update tab visibility settings
  const updateTabVisibilityMutation = useMutation({
    mutationFn: async (settings: TabVisibility) => {
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
      
      return (await res.json()).success;
    },
    onSuccess: () => {
      // Invalidate the query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ["tabVisibility", userId] });
    },
  });

  // Function to open the dialog
  const openVisibilityDialog = (tab?: TabName) => {
    setActiveTab(tab);
    setIsDialogOpen(true);
  };

  // Function to close the dialog
  const closeVisibilityDialog = () => {
    setIsDialogOpen(false);
    setActiveTab(undefined);
  };

  // Function to save the settings
  const saveTabVisibility = async (settings: TabVisibility): Promise<boolean> => {
    try {
      const result = await updateTabVisibilityMutation.mutateAsync(settings);
      return !!result;
    } catch (error) {
      console.error("Error saving tab visibility settings:", error);
      return false;
    }
  };

  // Check if a specific tab is visible to a visitor based on their family membership
  const isTabVisibleToVisitor = (
    tabName: TabName,
    visitorFamilyIds: string[]
  ): boolean => {
    if (!data) return true; // Default to visible if data is not loaded yet
    
    const tabVisibility = data.tabVisibility[tabName];
    
    // If visibility is 'everyone', it's visible to all
    if (tabVisibility === "everyone") return true;
    
    // Otherwise, check if the visitor is in the family that can see this tab
    return visitorFamilyIds.includes(tabVisibility);
  };

  return {
    tabVisibility: data?.tabVisibility,
    families: data?.families || [],
    isCurrentUser: data?.isCurrentUser || false,
    isLoading,
    error,
    isDialogOpen,
    activeTab,
    openVisibilityDialog,
    closeVisibilityDialog,
    saveTabVisibility,
    isTabVisibleToVisitor,
  };
}; 