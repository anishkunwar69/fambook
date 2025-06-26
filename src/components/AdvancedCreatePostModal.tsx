"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { toast } from "react-hot-toast";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Add new constants for media limits
const MAX_MEDIA_COUNT = 5;
const MAX_VIDEO_COUNT = 1;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

type Family = {
  id: string;
  name: string;
};

type ModalStep = "selectFiles" | "postDetails";

interface SelectedMediaItem {
  file: File;
  previewUrl: string;
  type: "image" | "video";
  objectPosition?: string;
}

interface AdvancedCreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  families: Family[] | undefined;
}

export function AdvancedCreatePostModal({
  isOpen,
  onClose,
  families,
}: AdvancedCreatePostModalProps) {
  const { user: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<ModalStep>("selectFiles");
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaItem[]>([]);
  const [postDetailsMediaIndex, setPostDetailsMediaIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const [caption, setCaption] = useState("");
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<Set<string>>(
    new Set()
  );
  const [isSharing, setIsSharing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = useCallback(() => {
    setCurrentStep("selectFiles");
    setSelectedMedia([]);
    setPostDetailsMediaIndex(0);
    setCaption("");
    setSelectedFamilyIds(new Set());
    setIsSharing(false);
    setFileError(null);
    onClose();
  }, [onClose]);

  const processFiles = useCallback(
    async (files: File[]) => {
      setFileError(null);

      // Check if adding these files would exceed the total media limit
      if (selectedMedia.length + files.length > MAX_MEDIA_COUNT) {
        setFileError(`You can only add up to ${MAX_MEDIA_COUNT} media items per post in the free plan.`);
        return;
      }

      // Count existing videos
      const existingVideoCount = selectedMedia.filter(item => item.type === "video").length;

      const validFiles: File[] = [];
      for (const file of files) {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        // Check file type
        if (!isImage && !isVideo) {
          setFileError("Only images and videos are allowed.");
          return;
        }

        // Check video count limit
        if (isVideo && existingVideoCount + validFiles.filter(f => f.type.startsWith("video/")).length >= MAX_VIDEO_COUNT) {
          setFileError(`You can only include ${MAX_VIDEO_COUNT} video per post in the free plan.`);
          return;
        }

        // Check file size based on type
        if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
          setFileError(`Images can only be up to ${MAX_IMAGE_SIZE_MB}MB in the free plan.`);
          return;
        }

        if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
          setFileError(`Videos can only be up to ${MAX_VIDEO_SIZE_MB}MB in the free plan.`);
          return;
        }

        validFiles.push(file);
      }

      const newMediaItems: SelectedMediaItem[] = validFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        type: file.type.startsWith("image/") ? "image" : "video",
      }));

      const startIndexForNewItems = selectedMedia.length;
      const updatedMedia = [...selectedMedia, ...newMediaItems];
      setSelectedMedia(updatedMedia);

      if (updatedMedia.length > 0) {
        setCurrentStep("postDetails");
        setPostDetailsMediaIndex(startIndexForNewItems);
        setDirection(1);
      }
    },
    [selectedMedia, setDirection]
  );

  const handleFileSelect = useCallback(
    (eventOrFiles: React.ChangeEvent<HTMLInputElement> | File[]) => {
      const files = Array.isArray(eventOrFiles)
        ? eventOrFiles
        : Array.from(eventOrFiles.target.files || []);
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  const handleRemoveMedia = (indexToRemove: number) => {
    if (isSharing) return;
    setSelectedMedia((currentMedia) => {
      const newMedia = currentMedia.filter(
        (_, index) => index !== indexToRemove
      );
      if (postDetailsMediaIndex >= newMedia.length) {
        setPostDetailsMediaIndex(Math.max(0, newMedia.length - 1));
      }
      if (newMedia.length === 0) {
        setCurrentStep("selectFiles");
      }
      return newMedia;
    });
  };

  const openFileDialog = () => {
    if (isSharing) return;
    
    // Check if we've reached the media limit
    if (selectedMedia.length >= MAX_MEDIA_COUNT) {
      setFileError(`You can only add up to ${MAX_MEDIA_COUNT} media items per post in the free plan.`);
      return;
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    } else {
      toast.error("Could not open file dialog.");
    }
  };

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      // Don't allow drag if at media limit
      if (selectedMedia.length >= MAX_MEDIA_COUNT) {
        event.dataTransfer.dropEffect = "none";
      }
    },
    [selectedMedia.length]
  );
  
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      // Don't process files if at media limit
      if (selectedMedia.length >= MAX_MEDIA_COUNT) {
        setFileError(`You can only add up to ${MAX_MEDIA_COUNT} media items per post in the free plan.`);
        return;
      }
      processFiles(Array.from(event.dataTransfer.files));
    },
    [processFiles, selectedMedia.length]
  );

  const createPostMutation = useMutation({
    mutationFn: async (postData: {
      familyId: string;
      text: string;
      media: { url: string; type: "PHOTO" | "VIDEO" }[];
    }) => {
      const response = await fetch(`/api/families/${postData.familyId}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: postData.text,
          media: postData.media,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error("Failed to create post.");
      return result.data;
    },
    onSettled: () => {
      setIsSharing(false);
    },
  });

  const handleShare = async () => {
    if (selectedFamilyIds.size === 0) {
      toast.error("Please select at least one family to share with.");
      return;
    }
    if (!caption && selectedMedia.length === 0) {
      toast.error("Please add a caption or some media.");
      return;
    }

    // Check if the post limit has been reached for any selected family
    try {
      for (const familyId of selectedFamilyIds) {
        const response = await fetch(`/api/families/${familyId}/stats`);
        const result = await response.json();
        
        if (result.success && 
            result.data.postStats.currentMonthPosts >= result.data.postStats.postLimit) {
          toast.error("Monthly post limit reached. Upgrade to Premium for unlimited posts.");
          onClose(); // Close the modal
          return;
        }
      }
    } catch (error) {
      console.log("Error checking post limits:", error);
      // Continue with post creation even if we can't check the limits
    }

    setIsSharing(true);

    try {
      // 1. Get signature from our new API route
      const signResponse = await fetch("/api/upload/sign", { method: "POST" });
      const signData = await signResponse.json();
      if (!signData.success) {
        throw new Error("Could not get upload signature.");
      }

      const { signature, timestamp, cloudName, apiKey } = signData;

      // 2. Upload each file directly to Cloudinary
      const uploadPromises = selectedMedia.map(async (mediaItem) => {
        const formData = new FormData();
        formData.append("file", mediaItem.file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
        formData.append("folder", "fambook");

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadData = await uploadResponse.json();
        if (uploadData.error) {
          throw new Error(uploadData.error.message);
        }

        return {
          url: uploadData.secure_url,
          type: uploadData.resource_type === "image" ? "PHOTO" : "VIDEO",
        };
      });

      const uploadedMedia = await Promise.all(uploadPromises);

      // 3. Create the post in our database for each selected family
      const postPromises = Array.from(selectedFamilyIds).map(
        async (familyId) => {
          return createPostMutation.mutateAsync({
            familyId,
            text: caption,
            media: uploadedMedia as { url: string; type: "PHOTO" | "VIDEO" }[],
          });
        }
      );

      await Promise.all(postPromises);

      toast.success(
        `Post shared with ${selectedFamilyIds.size} ${selectedFamilyIds.size === 1 ? "family" : "families"}!`
      );
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      resetModal();
    } catch (error) {
      toast.error("Upload failed: Unknown error");
      setIsSharing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "selectFiles":
        return (
          <motion.div
            key="selectFiles"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex flex-col items-center justify-center h-full w-full p-8 md:p-12 bg-gray-50"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center text-center w-full max-w-md mx-auto">
              <UploadCloud className="w-20 h-20 md:w-28 md:h-28 text-gray-300 mb-6" />
              <h2 className="text-lg md:text-2xl font-semibold text-gray-700 mb-3">
                Drag photos and videos here
              </h2>
              {fileError && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md my-4 w-full text-center">
                  {fileError}
                </p>
              )}
              <div className="text-xs text-gray-500 mb-4">
                <p>Free plan limits:</p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>Total 5 media items per post</li>
                  <li>Maximum 1 video per post</li>
                  <li>Images: up to 10MB each</li>
                  <li>Videos: up to 100MB each</li>
                </ul>
              </div>
              <Button
                onClick={openFileDialog}
                variant="default"
                className="bg-rose-500 hover:bg-rose-600 text-white text-sm md:text-base px-6 py-3"
                disabled={isSharing}
              >
                Select from computer
              </Button>
            </div>
          </motion.div>
        );
      case "postDetails":
        if (selectedMedia.length === 0) {
          setCurrentStep("selectFiles");
          return (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
          );
        }
        const currentMediaForDetails = selectedMedia[postDetailsMediaIndex];
        return (
          <motion.div
            key="postDetails"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full w-full bg-white text-black"
          >
            <div className="flex items-center justify-between p-3.5 border-b border-gray-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentStep("selectFiles")}
                className="hover:bg-gray-100 rounded-full"
                disabled={isSharing}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h3 className="text-md font-semibold">Create new post</h3>
              <Button
                variant="link"
                onClick={handleShare}
                disabled={isSharing}
                className="text-rose-500 hover:text-rose-600 px-0"
              >
                {isSharing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Share"
                )}
              </Button>
            </div>

            <div className="flex-grow flex flex-col md:flex-row h-full overflow-hidden">
              {/* Media Preview Section */}
              <div className="relative w-full sm:aspect-[4/3] aspect-square md:aspect-auto md:flex-1 bg-black flex items-center justify-center overflow-hidden">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={postDetailsMediaIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                    }}
                    className="absolute inset-0 w-full h-full"
                  >
                    {currentMediaForDetails.type === "image" ? (
                      <img
                        src={currentMediaForDetails.previewUrl}
                        alt={`Preview ${postDetailsMediaIndex + 1}`}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <video
                        src={currentMediaForDetails.previewUrl}
                        controls
                        className="object-contain w-full h-full"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Close button for the current image */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-20 bg-black/50 text-white hover:bg-black/75 hover:text-white rounded-full h-8 w-8"
                  onClick={() => handleRemoveMedia(postDetailsMediaIndex)}
                  aria-label="Remove image"
                  disabled={isSharing}
                >
                  <X className="h-5 w-5" />
                </Button>

                {/* Navigation Arrows */}
                {selectedMedia.length > 1 && (
                  <>
                    {postDetailsMediaIndex > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDirection(-1);
                          setPostDetailsMediaIndex((p) => p - 1);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-1.5 z-10"
                        disabled={isSharing}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                    )}
                    {postDetailsMediaIndex < selectedMedia.length - 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDirection(1);
                          setPostDetailsMediaIndex((p) => p + 1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 z-10"
                        disabled={isSharing}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    )}
                  </>
                )}
                {selectedMedia.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                    {selectedMedia.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (index === postDetailsMediaIndex) return;
                          const newDirection =
                            index > postDetailsMediaIndex ? 1 : -1;
                          setDirection(newDirection);
                          setPostDetailsMediaIndex(index);
                        }}
                        className={`w-1.5 h-1.5 rounded-full ${postDetailsMediaIndex === index ? "bg-white scale-125" : "bg-white/50"}`}
                        disabled={isSharing}
                      ></button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Details Form */}
              <div className="w-full md:w-[340px] md:flex-shrink-0 p-4 border-l border-gray-200 flex flex-col flex-1 md:flex-none md:space-y-4 space-y-2 overflow-y-auto sm:max-h-[40vh] md:max-h-none">
                {currentUser && (
                  <div className="flex items-center space-x-3">
                    <Avatar className="sm:h-9 sm:w-9 h-8 w-8">
                      <AvatarImage
                        src={currentUser.imageUrl || undefined}
                        alt={currentUser.fullName || "User"}
                      />
                      <AvatarFallback>
                        {currentUser.fullName
                          ? currentUser.fullName.charAt(0).toUpperCase()
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium sm:text-sm text-xs">
                      {currentUser.fullName}
                    </span>
                  </div>
                )}
                <div className="text-xs text-gray-400 text-right">
                  {caption.length}/2200
                </div>
                <Textarea
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="md:min-h-[120px] min-h-[90px] text-sm border-gray-200 focus-visible:ring-rose-500/50 resize-none"
                  maxLength={2200}
                  disabled={isSharing}
                />

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    Media: {selectedMedia.length}/{MAX_MEDIA_COUNT}
                  </span>
                  <span>
                    Videos: {selectedMedia.filter(m => m.type === "video").length}/{MAX_VIDEO_COUNT}
                  </span>
                </div>

                {fileError && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md my-2">
                    {fileError}
                  </p>
                )}

                {families && families.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Share with:
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between h-10 text-sm"
                          disabled={isSharing}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Users className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {selectedFamilyIds.size === 0
                                ? "Select families..."
                                : selectedFamilyIds.size === families.length
                                  ? "All Families"
                                  : `${selectedFamilyIds.size} ${selectedFamilyIds.size === 1 ? "Family" : "Families"} Selected`}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--trigger-width] max-w-[90vw]">
                        <div className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (selectedFamilyIds.size === families.length) {
                                setSelectedFamilyIds(new Set());
                              } else {
                                setSelectedFamilyIds(
                                  new Set(families.map((f) => f.id))
                                );
                              }
                            }}
                            className="w-full justify-start mb-2 h-8"
                            disabled={isSharing}
                          >
                            <div className="flex items-center gap-2">
                              {selectedFamilyIds.size === families.length ? (
                                <X className="w-4 h-4" />
                              ) : (
                                <Users className="w-4 h-4" />
                              )}
                              <span className="text-sm">
                                {selectedFamilyIds.size === families.length
                                  ? "Clear All"
                                  : "Select All"}
                              </span>
                            </div>
                          </Button>
                          <div className="h-px bg-gray-100 -mx-2 mb-2" />
                          <div className="max-h-[150px] overflow-y-auto space-y-1">
                            {families.map((family) => (
                              <Button
                                key={family.id}
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedFamilyIds((prev) => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(family.id)) {
                                      newSet.delete(family.id);
                                    } else {
                                      newSet.add(family.id);
                                    }
                                    return newSet;
                                  });
                                }}
                                className="w-full justify-start h-8"
                                disabled={isSharing}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {selectedFamilyIds.has(family.id) ? (
                                    <div className="w-4 h-4 rounded-sm bg-rose-500 flex items-center justify-center shrink-0">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-sm border border-gray-300 shrink-0" />
                                  )}
                                  <span className="truncate text-sm">
                                    {family.name}
                                  </span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                <Button
                  onClick={openFileDialog}
                  className="w-full text-sm bg-rose-500 hover:bg-rose-600 text-white mt-auto"
                  disabled={isSharing || selectedMedia.length >= MAX_MEDIA_COUNT}
                >
                  <ImagePlus className="w-4 h-4 mr-2" /> 
                  {selectedMedia.length >= MAX_MEDIA_COUNT ? 
                    "Media limit reached" : 
                    "Add more media"
                  }
                </Button>
              </div>
            </div>
          </motion.div>
        );
      default:
        setCurrentStep("selectFiles");
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isSharing && !open) resetModal();
      }}
    >
      <DialogContent
        className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl h-[85vh] md:h-[calc(var(--vh,1vh)*85)] flex flex-col bg-white border-0 shadow-2xl rounded-lg overflow-hidden"
        hideCloseButton={true}
        fullScreen={true}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*"
          multiple
          disabled={isSharing}
        />
        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
        {isSharing && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50 cursor-not-allowed">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
            <span className="ml-4 text-lg font-semibold text-rose-500">
              Uploading...
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

if (typeof window !== "undefined") {
  const setVh = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };
  window.addEventListener("resize", setVh);
  setVh();
}
