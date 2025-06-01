import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  UserPlus,
  UserCircle,
  MapPin,
  Calendar,
  Heart,
  Globe,
  FileText,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

type ProfileField = {
  name: string;
  icon: React.ReactNode;
  completed: boolean;
};

type ProfileData = {
  userId: string;
  firstName: string;
  lastName: string;
  profileImage?: string | null;
  coverImage?: string | null;
  dateOfBirth?: Date | null;
  bio?: string | null;
  currentPlace?: string | null;
  birthPlace?: string | null;
  relationshipStatus?: string | null;
  languages?: string[] | null;
};

interface ProfileCompletionPromptProps {
  profileData: ProfileData;
  isFirstLogin?: boolean;
}

export function ProfileCompletionPrompt({
  profileData,
  isFirstLogin = false,
}: ProfileCompletionPromptProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Check if this is the first login or if profile is incomplete
  useEffect(() => {
    // Only show after first login or if explicitly requested
    const hasSeenPrompt = localStorage.getItem("profile_prompt_seen");
    
    if ((isFirstLogin || !hasSeenPrompt) && profileCompletion < 70) {
      setIsOpen(true);
      localStorage.setItem("profile_prompt_seen", "true");
    }
  }, [isFirstLogin]);

  // Calculate which fields are completed
  const profileFields: ProfileField[] = [
    {
      name: "Profile Picture",
      icon: <UserCircle className="h-5 w-5" />,
      completed: !!profileData.profileImage,
    },
    {
      name: "Date of Birth",
      icon: <Calendar className="h-5 w-5" />,
      completed: !!profileData.dateOfBirth,
    },
    {
      name: "Bio",
      icon: <FileText className="h-5 w-5" />,
      completed: !!profileData.bio && profileData.bio.length > 0,
    },
    {
      name: "Current Location",
      icon: <MapPin className="h-5 w-5" />,
      completed: !!profileData.currentPlace,
    },
    {
      name: "Relationship Status",
      icon: <Heart className="h-5 w-5" />,
      completed: !!profileData.relationshipStatus,
    },
    {
      name: "Languages",
      icon: <Globe className="h-5 w-5" />,
      completed: !!profileData.languages && profileData.languages.length > 0,
    },
  ];

  // Calculate completion percentage
  const completedFields = profileFields.filter((field) => field.completed).length;
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

  const handleEditProfile = () => {
    setIsOpen(false);
    router.push(`/profile/${profileData.userId}/edit/profile-info`);
  };

  const handleSkip = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to FamBook!</DialogTitle>
          <DialogDescription>
            Complete your profile to help family members connect with you.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm font-medium">{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} className="h-2" />

          <div className="mt-6 space-y-3">
            {profileFields.map((field, index) => (
              <div
                key={index}
                className="flex items-center p-2 rounded-lg border"
                style={{
                  borderColor: field.completed ? "#10b981" : "#e5e7eb",
                  backgroundColor: field.completed ? "#f0fdf4" : "white",
                }}
              >
                <div className="mr-3">{field.icon}</div>
                <div className="flex-1">{field.name}</div>
                {field.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="sm:w-auto w-full"
          >
            I'll do this later
          </Button>
          <Button
            onClick={handleEditProfile}
            className="bg-rose-500 hover:bg-rose-600 sm:w-auto w-full flex items-center gap-2"
          >
            Complete Profile
            <ChevronRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 