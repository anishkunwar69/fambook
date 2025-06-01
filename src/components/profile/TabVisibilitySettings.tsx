"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Eye, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type TabName = "overview" | "memories" | "timeline" | "details" | "posts";

export interface FamilyOption {
  id: string;
  name: string;
}

export type TabVisibility = {
  [key in TabName]: "everyone" | string; // "everyone" or familyId
};

interface TabVisibilitySettingsProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  initialSettings: TabVisibility;
  families: FamilyOption[];
  onSave: (settings: TabVisibility) => Promise<boolean>;
  activeTab?: TabName;
}

export function TabVisibilitySettings({
  userId,
  isOpen,
  onClose,
  initialSettings,
  families,
  onSave,
  activeTab,
}: TabVisibilitySettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<TabVisibility>(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset settings when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings);
    }
  }, [isOpen, initialSettings]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const success = await onSave(settings);
      if (success) {
        toast({
          title: "Privacy settings updated",
          description: "Your tab visibility settings have been saved.",
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: "Failed to save privacy settings. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabVisibilityChange = (tab: TabName, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [tab]: value,
    }));
  };

  // Get the tab label for display
  const getTabLabel = (tab: TabName): string => {
    switch (tab) {
      case "overview":
        return "Overview";
      case "memories":
        return "Memories";
      case "timeline":
        return "Life Timeline";
      case "details":
        return "Personal Details";
      case "posts":
        return "Posts";
      default:
        return tab;
    }
  };

  // Get the visibility icon based on setting
  const getVisibilityIcon = (visibility: string) => {
    if (visibility === "everyone") {
      return <Eye className="h-4 w-4 text-gray-500" />;
    }
    return <Users className="h-4 w-4 text-rose-500" />;
  };

  // Get visibility label
  const getVisibilityLabel = (visibility: string) => {
    if (visibility === "everyone") {
      return "Everyone";
    }
    
    const family = families.find(f => f.id === visibility);
    return family ? family.name : "Unknown Family";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-rose-500" />
            {activeTab 
              ? `Who can see your ${getTabLabel(activeTab).toLowerCase()}?` 
              : "Tab Visibility Settings"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {activeTab ? (
            // Show only active tab settings if specified
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-base font-medium">{getTabLabel(activeTab)}</Label>
                  <p className="text-sm text-gray-500">
                    Control who can see your {getTabLabel(activeTab).toLowerCase()} tab
                  </p>
                </div>
                <Select 
                  value={settings[activeTab]}
                  onValueChange={(value) => handleTabVisibilityChange(activeTab, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                      {getVisibilityIcon(settings[activeTab])}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    {families.map((family) => (
                      <SelectItem key={family.id} value={family.id}>
                        {family.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            // Show all tab settings
            <div className="space-y-3">
              {Object.keys(settings).map((tab) => (
                <div 
                  key={tab} 
                  className="flex items-center justify-between gap-4 pb-3 border-b last:border-b-0"
                >
                  <div>
                    <Label className="text-base font-medium">{getTabLabel(tab as TabName)}</Label>
                    <p className="text-sm text-gray-500">
                      Control who can see your {getTabLabel(tab as TabName).toLowerCase()} tab
                    </p>
                  </div>
                  <Select 
                    value={settings[tab as TabName]}
                    onValueChange={(value) => handleTabVisibilityChange(tab as TabName, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <div className="flex items-center gap-2">
                        {getVisibilityIcon(settings[tab as TabName])}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      {families.map((family) => (
                        <SelectItem key={family.id} value={family.id}>
                          {family.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-rose-500 hover:bg-rose-600"
          >
            {isSubmitting ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 