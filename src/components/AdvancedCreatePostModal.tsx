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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  UploadCloud,
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
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | undefined>(
    undefined
  );
  const [isSharing, setIsSharing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = useCallback(() => {
    setCurrentStep("selectFiles");
    setSelectedMedia([]);
    setPostDetailsMediaIndex(0);
    setCaption("");
    setSelectedFamilyId(undefined);
    setIsSharing(false);
    setFileError(null);
    onClose();
  }, [onClose]);

  const processFiles = useCallback(
    async (files: File[]) => {
      setFileError(null);

      const validFiles: File[] = [];
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setFileError(`Each file can only be up to ${MAX_FILE_SIZE_MB}MB.`);
          return; // Stop processing this batch
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
    setSelectedMedia((currentMedia) => {
      const newMedia = currentMedia.filter(
        (_, index) => index !== indexToRemove
      );

      // Adjust the current index if needed
      if (postDetailsMediaIndex >= newMedia.length) {
        setPostDetailsMediaIndex(Math.max(0, newMedia.length - 1));
      }

      // If no media is left, go back to the selection step
      if (newMedia.length === 0) {
        setCurrentStep("selectFiles");
      }

      return newMedia;
    });
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    } else {
      toast.error("Could not open file dialog.");
    }
  };

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => event.preventDefault(),
    []
  );
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      processFiles(Array.from(event.dataTransfer.files));
    },
    [processFiles]
  );

  const createPostMutation = useMutation({
    mutationFn: async (postData: {
      text: string;
      media: { url: string; type: "PHOTO" | "VIDEO" }[];
    }) => {
      if (!selectedFamilyId) throw new Error("Family not selected.");

      const response = await fetch(`/api/families/${selectedFamilyId}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || "Failed to create post.");
      return result.data;
    },
    onSuccess: () => {
      toast.success("Post shared successfully!");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      resetModal();
    },
    onSettled: () => {
      setIsSharing(false);
    },
  });

  const handleShare = async () => {
    if (!selectedFamilyId) {
      toast.error("Please select a family to share with.");
      return;
    }
    if (!caption && selectedMedia.length === 0) {
      toast.error("Please add a caption or some media.");
      return;
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

      // 3. Create the post in our database
      await createPostMutation.mutateAsync({
        text: caption,
        media: uploadedMedia as { url: string; type: "PHOTO" | "VIDEO" }[],
      });
    } catch (error) {
      toast.error(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
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
            className="flex flex-col items-center justify-center h-full p-8 md:p-12 bg-gray-50"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <UploadCloud className="w-20 h-20 md:w-28 md:h-28 text-gray-300 mb-6" />
            <h2 className="text-lg md:text-2xl font-semibold text-gray-700 mb-3">
              Drag photos and videos here
            </h2>
            {fileError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md my-4 max-w-sm text-center">
                {fileError}
              </p>
            )}
            <Button
              onClick={openFileDialog}
              variant="default"
              className="bg-rose-500 hover:bg-rose-600 text-white text-sm md:text-base px-6 py-3"
            >
              Select from computer
            </Button>
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
            className="flex flex-col h-full bg-white text-black"
          >
            <div className="flex items-center justify-between p-3.5 border-b border-gray-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentStep("selectFiles")}
                className="hover:bg-gray-100 rounded-full"
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
              <div className="relative w-full aspect-square md:aspect-auto md:flex-1 bg-black flex items-center justify-center overflow-hidden">
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
                      ></button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Details Form */}
              <div className="w-full md:w-[340px] md:flex-shrink-0 p-4 border-l border-gray-200 flex flex-col flex-1 md:flex-none space-y-4 overflow-y-auto">
                {currentUser && (
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-9 w-9">
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
                    <span className="font-medium text-sm">
                      {currentUser.fullName}
                    </span>
                  </div>
                )}
                <Textarea
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-[120px] text-sm border-gray-200 focus-visible:ring-rose-500/50 resize-none"
                  maxLength={2200}
                />
                <div className="text-xs text-gray-400 text-right">
                  {caption.length}/2200
                </div>

                {fileError && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md my-2">
                    {fileError}
                  </p>
                )}

                {families && families.length > 0 && (
                  <Select
                    value={selectedFamilyId}
                    onValueChange={setSelectedFamilyId}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Select a family to share with" />
                    </SelectTrigger>
                    <SelectContent>
                      {families.map((family) => (
                        <SelectItem
                          key={family.id}
                          value={family.id}
                          className="text-sm"
                        >
                          {family.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  onClick={openFileDialog}
                  className="w-full text-sm bg-rose-500 hover:bg-rose-600 text-white mt-auto"
                >
                  <ImagePlus className="w-4 h-4 mr-2" /> Add more media
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
        if (!open) resetModal();
      }}
    >
      <DialogContent
        className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl h-[85vh] md:h-[calc(var(--vh,1vh)*85)] p-0 flex flex-col bg-white border-0 shadow-2xl rounded-lg overflow-hidden"
        hideCloseButton={true}
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
        />
        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
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
