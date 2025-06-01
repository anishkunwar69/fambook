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
  Mail,
  MapPin,
  PenSquare,
  Upload,
  Loader2,
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
  familyData,
}: ProfileHeaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bioDialogOpen, setBioDialogOpen] = useState(false);
  const [profilePictureDialogOpen, setProfilePictureDialogOpen] = useState(false);
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
    const relationshipCheck = profileData.relationshipStatus && profileData.relationshipStatus.trim();
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
    if (profileData.languages && profileData.languages.length > 0) completedFields++;

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
      if (!file.type.startsWith('image/')) {
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
      formData.append('profileImage', selectedFile);

      const response = await fetch(`/api/users/${userId}/profile/upload-picture`, {
        method: 'POST',
        body: formData,
      });

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
    setProfilePictureDialogOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full relative">
      {/* Cover Photo */}
      <div className="h-60 md:h-80 w-full relative overflow-hidden rounded-b-xl">
        {profileData.coverImage ? (
          <Image
            src={profileData.coverImage}
            alt={`${profileData.fullName}'s cover`}
            fill
            className="object-cover"
            priority
            onError={(e) => {
              // If image fails to load, replace with gradient background
              const target = e.target as HTMLElement;
              target.style.display = "none";
              target.parentElement!.classList.add(
                "bg-gradient-to-r",
                "from-rose-100",
                "to-rose-200"
              );
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-rose-100 to-rose-200" />
        )}

        {/* Edit Cover Button */}
        {isCurrentUser && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute right-4 top-4 opacity-90 shadow-sm"
          >
            <Edit className="w-3 h-3 mr-1" />
            Change Cover
          </Button>
        )}
      </div>

      <div className="relative pt-6 pb-6">
        {/* Profile Picture */}
        <div className="absolute left-6 md:left-10 -top-20 z-10">
          <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-4 border-white shadow-md">
            {profileData.profileImage ? (
              <Image
                src={profileData.profileImage}
                alt={profileData.fullName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-500 text-4xl font-semibold">
                {profileData.firstName?.[0]}
                {profileData.lastName?.[0]}
              </div>
            )}
            {isBirthday && (
              <div className="absolute -right-2 -top-2 bg-rose-500 rounded-full p-2 border-2 border-white">
                <Cake className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          {isCurrentUser && (
            <Button
              variant="outline"
              size="sm"
              className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0 bg-white shadow-sm hover:bg-gray-50"
              onClick={handleProfilePictureClick}
            >
              <Camera className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Name and Quick Info */}
        <div className="ml-44 md:ml-56 mr-4 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {profileData.fullName}
              </h1>
              {isBirthday && (
                <Badge
                  variant="secondary"
                  className="bg-rose-100 text-rose-700 animate-pulse"
                >
                  Birthday Today! 🎂
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center text-sm text-gray-600 mt-1 gap-x-4 gap-y-1">
              {age && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {age} years old
                </span>
              )}
              {profileData.currentPlace && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {profileData.currentPlace}
                </span>
              )}
              {profileData.relationshipStatus && (
                <span className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5" />
                  {profileData.relationshipStatus}
                </span>
              )}
              {profileData.languages && profileData.languages.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  <div className="flex flex-wrap gap-1">
                    {profileData.languages.map((language, index) => (
                      <span key={language}>
                        {language}
                        {index < profileData.languages!.length - 1 && (
                          <span className="mx-1 text-gray-400">•</span>
                        )}
                      </span>
                    ))}
                  </div>
                </span>
              )}
            </div>

            {/* Bio */}
            <div className="mt-2 max-w-2xl relative group">
              {profileData.bio ? (
                <p className="text-gray-700 pr-8">{profileData.bio}</p>
              ) : isCurrentUser ? (
                <p className="text-gray-500 italic pr-8">
                  Add a bio to tell others about yourself
                </p>
              ) : null}

              {isCurrentUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-0 right-0 h-7 w-7 p-0 rounded-full opacity-70 group-hover:opacity-100"
                  onClick={() => setBioDialogOpen(true)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            {isCurrentUser ? (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 bg-rose-500 hover:bg-rose-600"
                  asChild
                >
                  <Link href={`/profile/${userId}/edit/profile-info`}>
                    <PenSquare className="h-3.5 w-3.5" />
                    Edit Info
                  </Link>
                </Button>

                {/* Profile Completion Indicator (only for current user) */}
                {isCurrentUser && (
                  <div className="w-full mt-3">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span>Profile Completion</span>
                      <span>{profileCompletion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-rose-400 to-rose-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: `${profileCompletion}%` }}
                      ></div>
                    </div>
                    {profileCompletion < 100 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Complete your profile to help family members connect
                        with you.
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  className="gap-1.5 bg-rose-500 hover:bg-rose-600"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Message
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Bookmark className="h-3.5 w-3.5" />
                  Add to Favorites
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Family Connection Info */}
      <div className="container w-full mx-auto px-4">
        <div className="p-4 bg-rose-50 rounded-lg border border-rose-100">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div>
              <Link href={`/families`}>
                <button className="bg-rose-600 text-white px-4 py-2 rounded-md">
                  View All Families
                </button>
              </Link>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <p className="font-medium text-rose-900">
                  {familyData.totalConnectedFamilies}
                </p>
                <p className="text-rose-600">Connected Families</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* visual separator */}

      {/* Bio Update Dialog */}
      <Dialog open={bioDialogOpen} onOpenChange={setBioDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Bio</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Tell others about yourself..."
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              className="min-h-[120px]"
              maxLength={500}
            />
            <div className="text-xs text-right text-gray-500">
              {bioText.length}/500 characters
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBioDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBioUpdate}
              disabled={isSubmitting}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Picture Update Dialog */}
      <Dialog open={profilePictureDialogOpen} onOpenChange={setProfilePictureDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Preview Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-gray-200">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                ) : profileData.profileImage ? (
                  <Image
                    src={profileData.profileImage}
                    alt="Current profile picture"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-500 text-2xl font-semibold">
                    {profileData.firstName?.[0]}
                    {profileData.lastName?.[0]}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
                disabled={isUploadingPicture}
              >
                <Upload className="h-4 w-4" />
                {selectedFile ? 'Choose Different Photo' : 'Choose Photo'}
              </Button>

              {selectedFile && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 text-center">
              Recommended: Square image, at least 200x200 pixels. Max size: 5MB.
            </div>
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
              className="bg-rose-500 hover:bg-rose-600"
            >
              {isUploadingPicture ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Update Picture'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
