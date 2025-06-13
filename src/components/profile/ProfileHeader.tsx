import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Bookmark,
  Cake,
  Calendar,
  Camera,
  Edit,
  Globe,
  Heart,
  Loader2,
  Mail,
  MapPin,
  PenSquare,
  Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

interface ProfileHeaderProps {
  userId: string;
  isCurrentUser: boolean;
  profileData: {
    profileImage?: string | null;
    coverImage?: string | null;
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth?: Date | null;
    birthPlace?: string | null;
    currentPlace?: string | null;
    relationshipStatus?: string | null;
    bio?: string | null;
    isBirthday?: boolean;
    role?: string | null;
    languages?: string[] | null;
  };
  familyData: {
    memberSince: Date;
    familyName: string;
    familyId: string;
    totalConnectedFamilies: number;
    relationshipCount: number;
  };
}

export function ProfileHeader({
  userId,
  isCurrentUser,
  profileData,
}: ProfileHeaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bioDialogOpen, setBioDialogOpen] = useState(false);
  const [profilePictureDialogOpen, setProfilePictureDialogOpen] =
    useState(false);
  const [bioText, setBioText] = useState(profileData.bio || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  const age = profileData.dateOfBirth
    ? new Date().getFullYear() - new Date(profileData.dateOfBirth).getFullYear()
    : null;

  // Check if it's the person's birthday today
  const isBirthday = profileData.isBirthday || false;

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!isCurrentUser) return 0;

    console.log("ProfileHeader - Calculating completion for:", {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      dateOfBirth: profileData.dateOfBirth,
      bio: profileData.bio,
      currentPlace: profileData.currentPlace,
      birthPlace: profileData.birthPlace,
      relationshipStatus: profileData.relationshipStatus,
      languages: profileData.languages,
    });

    let completedFields = 0;
    let totalFields = 8; // Same as edit form: firstName, lastName, dateOfBirth, bio, currentPlace, birthPlace, relationshipStatus, languages

    // Basic required fields (usually always present)
    if (profileData.firstName) completedFields++;
    if (profileData.lastName) completedFields++;

    // Optional profile fields
    if (profileData.dateOfBirth) completedFields++;
    if (profileData.bio) completedFields++;
    if (profileData.currentPlace) completedFields++;
    if (profileData.birthPlace) completedFields++;

    // Relationship status check
    const relationshipCheck =
      profileData.relationshipStatus && profileData.relationshipStatus.trim();
    console.log("Relationship Status Debug:", {
      value: profileData.relationshipStatus,
      type: typeof profileData.relationshipStatus,
      truthyCheck: !!profileData.relationshipStatus,
      trimmedValue: profileData.relationshipStatus?.trim(),
      trimmedLength: profileData.relationshipStatus?.trim()?.length,
      finalCheck: relationshipCheck,
    });

    if (relationshipCheck) completedFields++;

    // Languages check
    if (profileData.languages && profileData.languages.length > 0)
      completedFields++;

    console.log("ProfileHeader - Completion calculation:", {
      completedFields,
      totalFields,
      percentage: Math.round((completedFields / totalFields) * 100),
    });

    return Math.round((completedFields / totalFields) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  const handleBioUpdate = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/users/${userId}/profile/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          bio: bioText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Bio updated successfully",
        });
        setBioDialogOpen(false);
        // We would ideally update the UI here, but we'll rely on a page refresh for now
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update bio",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfilePictureClick = () => {
    setProfilePictureDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureUpdate = async () => {
    if (!selectedFile || isUploadingPicture) return;

    try {
      setIsUploadingPicture(true);

      const formData = new FormData();
      formData.append("profileImage", selectedFile);

      const response = await fetch(
        `/api/users/${userId}/profile/upload-picture`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });
        setProfilePictureDialogOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        // Refresh the page to show updated picture
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update profile picture",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleCancelPictureUpdate = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProfilePictureDialogOpen(false);
  };

  return (
    <div className="bg-rose-100 rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-100/30 to-amber-100/30 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-rose-100/30 to-purple-100/30 rounded-full blur-3xl -z-10 translate-y-1/2 -translate-x-1/2" />

      {/* Main Content */}
      <div
        className={`relative flex flex-col items-center gap-6 z-10 ${
          isCurrentUser ? "md:flex-row" : "md:flex-row items-center"
        }`}
      >
        {/* Profile Image */}
        <div className="relative flex-shrink-0">
          <Image
            src={profileData.profileImage || "/placeholder-avatar.png"}
            alt={`${profileData.fullName}'s profile picture`}
            width={168}
            height={168}
            className="rounded-full object-cover border-4 border-white shadow-lg"
          />
          {isCurrentUser && (
            <button
              onClick={handleProfilePictureClick}
              className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            >
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 w-full space-y-4">
          <div
            className={`flex flex-col gap-2 items-center ${
              isCurrentUser
                ? "sm:flex-row justify-between"
                : "md:items-start"
            }`}
          >
            <div
              className={`space-y-2 text-center ${
                isCurrentUser ? "sm:text-left" : "md:text-left"
              }`}
            >
              <h1
                className={`text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 justify-center ${
                  isCurrentUser ? "sm:justify-start" : "md:justify-start"
                }`}
              >
                {profileData.fullName}
                {isBirthday && <Cake className="w-6 h-6 text-rose-500" />}
              </h1>
              {profileData.bio ? (
                <p
                  className={`text-gray-600 flex items-center gap-2 justify-center ${
                    isCurrentUser ? "sm:justify-start" : "md:justify-start"
                  }`}
                >
                  {profileData.bio}
                  {isCurrentUser && (
                    <button onClick={() => setBioDialogOpen(true)}>
                      <PenSquare className="w-4 h-4 text-gray-500 hover:text-rose-500 transition-colors" />
                    </button>
                  )}
                </p>
              ) : isCurrentUser ? (
                <button
                  onClick={() => setBioDialogOpen(true)}
                  className={`text-gray-400 flex items-center gap-2 justify-center text-sm border border-dashed border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 hover:text-rose-500 transition-all ${
                    isCurrentUser ? "sm:justify-start" : "md:justify-start"
                  }`}
                >
                  <PenSquare className="w-4 h-4" />
                  <span>Add a short bio about yourself</span>
                </button>
              ) : (
                <p className="text-gray-400 italic text-sm">No bio added yet</p>
              )}
            </div>
            {isCurrentUser ? (
              <Link href={`/profile/${userId}/edit/profile-info`}>
                <Button className="bg-rose-500 hover:bg-rose-600 text-white w-full sm:w-auto sm:mb-8">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit info
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2 pt-2">
                <Button className="bg-rose-500 hover:bg-rose-600 text-white">
                  <Mail className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button variant="outline">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Add to Favorites
                </Button>
              </div>
            )}
          </div>

          <div
            className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 justify-center ${
              isCurrentUser ? "sm:justify-start" : "md:justify-start"
            }`}
          >
            {age && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{age} years old</span>
              </div>
            )}
            {profileData.currentPlace && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{profileData.currentPlace}</span>
              </div>
            )}
            {profileData.relationshipStatus && (
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                <span>{profileData.relationshipStatus}</span>
              </div>
            )}
            {profileData.languages && profileData.languages.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>{profileData.languages.join(", ")}</span>
              </div>
            )}
          </div>

          {isCurrentUser && profileCompletion > 0 && (
            <div className="sm:pt-2 max-sm:pb-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">
                  Profile Completion
                </span>
                <span className="text-xs font-medium text-rose-600">
                  {profileCompletion}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bio Edit Dialog */}
      <Dialog open={bioDialogOpen} onOpenChange={setBioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bio</DialogTitle>
          </DialogHeader>
          <Textarea
            value={bioText}
            onChange={(e) => setBioText(e.target.value)}
            placeholder="Tell your family a little about yourself..."
            rows={5}
          />
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setBioDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleBioUpdate} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Picture Upload Dialog */}
      <Dialog
        open={profilePictureDialogOpen}
        onOpenChange={setProfilePictureDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-4">
            <div className="w-40 h-40 rounded-full overflow-hidden flex items-center justify-center border-4 border-gray-100">
              <Image
                src={
                  previewUrl ||
                  profileData.profileImage ||
                  "/placeholder-avatar.png"
                }
                alt="Profile picture preview"
                width={160}
                height={160}
                className="object-cover w-full h-full"
              />
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Image
            </Button>
            {selectedFile && (
              <p className="text-sm text-gray-500">{selectedFile.name}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelPictureUpdate}
              disabled={isUploadingPicture}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProfilePictureUpdate}
              disabled={!selectedFile || isUploadingPicture}
            >
              {isUploadingPicture && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
