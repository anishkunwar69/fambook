"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, Loader2, Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";

export type TabName = "memories" | "timeline" | "details" | "posts";

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

  const renderSelectTriggerContent = (visibilityValue: string) => (
    <div className="flex items-center gap-2">
      {visibilityValue === "everyone" ? (
        <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      ) : (
        <Users className="h-4 w-4 text-rose-500 dark:text-rose-400" />
      )}
      <SelectValue placeholder="Select visibility" />
    </div>
  );

  const renderFormItem = (tabKey: TabName) => (
    <div key={tabKey} className="space-y-2">
      <Label
        htmlFor={`select-${tabKey}`}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {getTabLabel(tabKey)}
      </Label>
      <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1 mb-1.5">
        Control who can see your {getTabLabel(tabKey).toLowerCase()} tab.
      </p>
      <Select
        value={settings[tabKey]}
        onValueChange={(value) => handleTabVisibilityChange(tabKey, value)}
      >
        <SelectTrigger
          id={`select-${tabKey}`}
          className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        >
          {renderSelectTriggerContent(settings[tabKey])}
        </SelectTrigger>
        <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
          <SelectItem value="everyone" className="hover:dark:bg-gray-600">
            Everyone
          </SelectItem>
          {families.map((family) => (
            <SelectItem
              key={family.id}
              value={family.id}
              className="hover:dark:bg-gray-600"
            >
              {family.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-rose-500 dark:text-rose-400" />
            {activeTab
              ? `Privacy: ${getTabLabel(activeTab)} Tab`
              : "Tab Visibility Settings"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {activeTab
            ? renderFormItem(activeTab)
            : Object.keys(settings).map((tab) =>
                renderFormItem(tab as TabName)
              )}
        </div>

        <DialogFooter className="pt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-rose-500 hover:bg-rose-600 text-white dark:bg-rose-600 dark:hover:bg-rose-700 min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
