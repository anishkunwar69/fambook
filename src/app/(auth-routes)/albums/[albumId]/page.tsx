"use client";

import { AddToMemoryButton } from "@/components/shared/AddToMemoryButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Film,
  Home,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";

type Media = {
  id: string;
  url: string;
  type: string;
  createdAt: string;
};

type Album = {
  id: string;
  name: string;
  description: string | null;
  mediaLimit: number;
  familyId: string;
  familyName: string;
  isInMemory: boolean;
  family: {
    id: string;
    name: string;
  };
  media: Media[];
  _count: {
    media: number;
  };
};

function AlbumSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap mt-[8px]">
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse shrink-0" />
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse shrink-0" />
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse shrink-0" />
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse shrink-0" />
      </div>

      {/* Header Section Skeleton */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-rose-100/50 mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
          <div className="text-center md:text-left">
            <div className="h-7 md:h-9 bg-gray-200 rounded w-48 md:w-64 mb-2 mx-auto md:mx-0"></div>
            <div className="h-4 bg-gray-200 rounded w-36 md:w-48 mx-auto md:mx-0"></div>
          </div>
          <div className="flex flex-row items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:flex-initial">
              <div className="h-10 bg-gray-200 rounded w-full md:w-32"></div>
            </div>
            <div className="flex-1 md:flex-initial">
              <div className="h-10 bg-gray-200 rounded w-full md:w-32"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

function MediaLimitCard({
  currentMedia,
  mediaLimit,
}: {
  currentMedia: number;
  mediaLimit: number;
}) {
  // Calculate the usage percentage
  const percentage = Math.min((currentMedia / mediaLimit) * 100, 100);
  const mediaRemaining = Math.max(0, mediaLimit - currentMedia);
  const isFull = currentMedia >= mediaLimit;

  return (
    <div className={`rounded-lg p-3 mb-8 ${isFull ? 'bg-rose-50' : 'bg-green-50'}`}>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium">
            Album Media Limit: {currentMedia}/{mediaLimit}
          </p>
          <span className="text-xs text-gray-600">
            {mediaRemaining} {mediaRemaining === 1 ? "item" : "items"} remaining
          </span>
        </div>
        
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white mb-2">
          <div
            className={`h-full absolute top-0 left-0 transition-all duration-300 ${isFull ? 'bg-rose-500' : 'bg-green-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <p className="text-xs text-gray-700">
          {isFull 
            ? "You've reached the media limit for this album. Each album can contain up to 15 media items." 
            : `You can add ${mediaRemaining} more media ${mediaRemaining === 1 ? 'item' : 'items'} to this album.`}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Maximum 1 video (up to 100MB) and images (up to 10MB each).
        </p>
      </div>
    </div>
  );
}

interface AddMediaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: string;
  albumName: string;
  currentMediaCount: number;
  mediaLimit: number;
  onUploadSuccess: () => void;
}

function AddMediaDialog({
  isOpen,
  onClose,
  albumId,
  albumName,
  currentMediaCount,
  mediaLimit,
  onUploadSuccess,
}: AddMediaDialogProps) {
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRefDialog = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE_MB = 100;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
      setPreviews([]);
      setFileError(null);
    }
  }, [isOpen]);

  const handleFileSelectDialog = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      processFiles(acceptedFiles);
    },
    [currentMediaCount, mediaLimit, selectedFiles]
  );

  const processFiles = (files: File[]) => {
    if (files.length === 0) return;
    setFileError(null);

    const newFilesToAdd: File[] = [];
    const newPreviewsToAdd: string[] = [];
    let stopProcessing = false;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const isVideo = file.type.startsWith('video/');
        const maxSizeMB = isVideo ? MAX_FILE_SIZE_MB : 10;
        
        if ((isVideo && file.size > MAX_FILE_SIZE_BYTES) || (!isVideo && file.size > 10 * 1024 * 1024)) {
          setFileError(
            `File too large. ${isVideo ? 'Videos' : 'Images'} can be maximum ${maxSizeMB}MB.`
          );
          stopProcessing = true;
          break;
        }
      }
      newFilesToAdd.push(file);
    }

    if (stopProcessing) return;

    const totalAfterAdd =
      currentMediaCount + selectedFiles.length + newFilesToAdd.length;
    if (totalAfterAdd > mediaLimit) {
      setFileError(
        `Cannot add ${newFilesToAdd.length} more files. Album limit is ${mediaLimit} items. You have ${
          currentMediaCount + selectedFiles.length
        } / ${mediaLimit}.`
      );
      return;
    }

    const videoFiles = selectedFiles.filter(f => f.type.startsWith('video/')).length;
    const newVideoFiles = newFilesToAdd.filter(f => f.type.startsWith('video/')).length;
    if (videoFiles + newVideoFiles > 1) {
      setFileError(
        "Only one video file is allowed per album."
      );
      return;
    }

    setSelectedFiles((prev) => [...prev, ...newFilesToAdd]);

    newFilesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "video/*": [] },
    noClick: true,
  });

  const { mutate: uploadMedia, isPending: isUploading } = useMutation({
    mutationFn: async () => {
      if (selectedFiles.length === 0) {
        toast.error("Please select files to upload.");
        return;
      }

      // 1. Get signature from our API route
      const signResponse = await fetch("/api/upload/sign", { method: "POST" });
      const signData = await signResponse.json();
      if (!signData.success) {
        throw new Error("Could not get upload signature.");
      }
      const { signature, timestamp, cloudName, apiKey } = signData;

      // 2. Upload each file directly to Cloudinary
      const uploadPromises = selectedFiles.map(async (file) => {
      const formData = new FormData();
        formData.append("file", file);
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
          throw new Error(
            `Upload failed`
          );
        }

        return {
          url: uploadData.secure_url,
          type: uploadData.resource_type === "image" ? "PHOTO" : "VIDEO",
        };
      });

      const uploadedMedia = await Promise.all(uploadPromises);

      // 3. Create media records in our database
      const response = await fetch(`/api/albums/${albumId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media: uploadedMedia }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to save uploaded media.");
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Media uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["album", albumId] });
      onUploadSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not upload media.");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isUploading && !open) onClose();
    }}>
      <DialogContent className="sm:max-w-2xl bg-white border-rose-100/50" hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="text-rose-600 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Add Media to "{albumName}"
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-600">
            Select photos or videos to upload. You can add up to {mediaLimit - currentMediaCount} more items.
            (Maximum limit: {mediaLimit} items per album, including max 1 video up to 100MB and images up to 10MB each)
          </DialogDescription>
        </DialogHeader>

        <div {...getRootProps()} className="pb-6 space-y-4">
          <input
            {...getInputProps()}
            ref={fileInputRefDialog}
            className="hidden"
            disabled={isUploading}
          />
          <div
            className={`mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 ${
              isDragActive
                ? "border-rose-500 bg-rose-50/50"
                : "border-gray-300 border-dashed"
            } rounded-md cursor-pointer transition-colors`}
            onClick={() => { if (!isUploading) fileInputRefDialog.current?.click(); }}
            style={isUploading ? { pointerEvents: 'none', opacity: 0.7 } : {}}
          >
            <div className="space-y-1 text-center">
              <CloudUpload
                className={`mx-auto h-12 w-12 ${
                  isDragActive ? "text-rose-500" : "text-gray-400"
                }`}
              />
              <div className="flex text-sm text-gray-600">
                <span
                  className={`relative cursor-pointer rounded-md font-medium ${
                    isDragActive
                      ? "text-rose-600"
                      : "text-rose-500 hover:text-rose-600"
                  } focus-within:outline-none focus-within:ring-2 focus-within:ring-rose-500 focus-within:ring-offset-1`}
                >
                  Upload files
                </span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                Photos and Videos up to {MAX_FILE_SIZE_MB}MB each
              </p>
            </div>
          </div>

          {fileError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {fileError}
            </p>
          )}

          {previews.length > 0 && (
            <ScrollArea className="h-64 border rounded-md">
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden group shadow-sm"
                  >
                    {selectedFiles[index]?.type.startsWith("image/") ? (
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-white">
                        <Film className="w-10 h-10 mb-2" />
                        <span className="text-xs truncate px-1">
                          {selectedFiles[index]?.name}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => { if (!isUploading) removeFile(index); }}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                      title="Remove file"
                      disabled={isUploading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={() => uploadMedia()}
            disabled={isUploading || selectedFiles.length === 0}
            className="bg-rose-500 hover:bg-rose-600"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${selectedFiles.length} File(s)`
            )}
          </Button>
        </DialogFooter>
        {isUploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50 cursor-not-allowed">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
            <span className="ml-4 text-lg font-semibold text-rose-500">Uploading...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(-1);
  const [isAddMediaDialogOpen, setIsAddMediaDialogOpen] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);

  // Fetch album
  const { data: album, isLoading, isError, error, refetch } = useQuery<Album>({
    queryKey: ["album", params.albumId],
    queryFn: async () => {
      const response = await fetch(`/api/albums/${params.albumId}`);
      const result = await response.json();
      if (!result.success) {
        throw new Error("Something went wrong!");
      }
      return result.data;
    },
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Check if adding these files would exceed the limit
      if (
        album &&
        album._count.media + files.length + selectedFiles.length >
          album.mediaLimit
      ) {
        toast.error(
          `Cannot add more files. Album limit is ${album.mediaLimit} items.`
        );
        return;
      }

      setSelectedFiles((prev) => [...prev, ...files]);

      // Create previews
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload media mutation
  const { mutate: uploadMedia, isPending: isUploading } = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("media", file);
      });

      const response = await fetch(`/api/albums/${params.albumId}/media`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    onSuccess: () => {
      setSelectedFiles([]);
      setPreviews([]);
      queryClient.invalidateQueries({ queryKey: ["album", params.albumId] });
      toast.success("Media uploaded successfully!");
    },
    onError: (error: Error) => {
      toast.error("Failed to upload media");
    },
  });

  // Delete media mutation
  const { mutate: deleteMedia, isPending: isDeletingMedia } = useMutation({
    mutationFn: async (mediaId: string) => {
      setDeletingMediaId(mediaId); // Set deleting ID before mutation call
      const response = await fetch(
        `/api/albums/${params.albumId}/media/${mediaId}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error("Something went wrong!");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["album", params.albumId] });
      toast.success("Media deleted successfully");
      setDeletingMediaId(null); // Clear deleting ID
    },
    onError: (error: Error) => {
      toast.error("Failed to delete media");
      setDeletingMediaId(null); // Clear deleting ID
    },
  });

  // Handle upload
  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }
    uploadMedia();
  };

  // Handle navigation in media viewer
  const handlePrevMedia = () => {
    if (!album || !album.media) return;
    if (selectedMediaIndex > 0) {
      const newIndex = selectedMediaIndex - 1;
      setSelectedMediaIndex(newIndex);
      setSelectedMedia(album.media[newIndex]);
    }
  };

  const handleNextMedia = () => {
    if (!album || !album.media) return;
    if (selectedMediaIndex < album.media.length - 1) {
      const newIndex = selectedMediaIndex + 1;
      setSelectedMediaIndex(newIndex);
      setSelectedMedia(album.media[newIndex]);
    }
  };

  // Handle media selection
  const handleMediaSelect = (media: Media, index: number) => {
    setSelectedMedia(media);
    setSelectedMediaIndex(index);
  };

  if (isLoading) {
    return <AlbumSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-gray-600 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap mt-[8px]"
        >
          <Link
            href="/"
            className="hover:text-rose-500 transition-colors flex items-center gap-1 shrink-0"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <Link
            href="/albums"
            className="hover:text-rose-500 transition-colors shrink-0"
          >
            <span>Albums</span>
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-rose-500 font-medium shrink-0">Album Details</span>
        </motion.div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-rose-100/50 mb-6 md:mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-4 md:mb-6">
            <div className="text-center md:text-left">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-lora font-bold text-gray-800 mb-2">
                Album Details
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
                View and manage your album content
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50/50 backdrop-blur-md rounded-2xl p-6 sm:p-12 text-center border border-red-100/50 text-red-700"
        >
          <div className="bg-red-100 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-lora font-bold text-red-800 mb-2">
            Failed to Load Album
          </h3>
          <p className="text-red-600 max-w-md mx-auto mb-4 sm:mb-6 text-sm sm:text-base">
            {error instanceof Error
              ? error.message
              : "An unknown error occurred."}
          </p>
          <Button
            onClick={() => refetch()}
            variant="destructive"
            className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
          >
            Retry
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
            <ImageIcon className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Album Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            This album might have been deleted or you don't have access to it.
          </p>
          <Link href="/albums">
            <Button className="bg-rose-500 hover:bg-rose-600">
              Back to Albums
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8 max-lg:pb-20">
        {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap mt-[8px]"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/albums" className="hover:text-rose-500 transition-colors">
          Albums
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-rose-500 font-medium">{album.name}</span>
      </motion.div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-rose-100/50 mb-6 md:mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-3xl font-lora font-bold text-gray-800">
              {album.name}
            </h1>
            <p className="text-gray-600">
              {album.description || "No description"}
            </p>
          </div>
          <div className="flex flex-row items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:flex-initial">
              <AddToMemoryButton
                itemId={album.id}
                itemType="album"
                initialIsInMemory={album.isInMemory}
                className="w-full md:w-auto"
              />
            </div>
            <div className="flex-1 md:flex-initial">
              <Button
                onClick={() => setIsAddMediaDialogOpen(true)}
                className={`flex items-center gap-2 w-full md:w-auto justify-center py-4  ${
                  album._count.media >= album.mediaLimit
                    ? "bg-gray-300 hover:bg-gray-300 cursor-not-allowed "
                    : "bg-rose-500 hover:bg-rose-600"
                }`}
                disabled={album._count.media >= album.mediaLimit}
                title={
                  album._count.media >= album.mediaLimit
                    ? "Media limit reached"
                    : "Add media to album"
                }
              >
                {album._count.media >= album.mediaLimit ? (
                  <Lock className="w-4 h-4 mr-1" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Add Media
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Media Limit Card */}
      <MediaLimitCard 
        currentMedia={album._count.media} 
        mediaLimit={album.mediaLimit} 
      />

      {/* Media Grid */}
      {album.media.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-12 text-center border border-rose-100/50 flex flex-col items-center justify-center"
        >
          <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <ImageIcon className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-xl font-lora font-bold text-gray-800 mb-2">
            No Media Yet
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6 text-xs sm:text-base">
            Add photos and videos to create beautiful memories in this
            album! Each album can contain up to {album.mediaLimit} media items 
            (maximum 1 video up to 100MB and images up to 10MB each).
          </p>
          <Button
            onClick={() => setIsAddMediaDialogOpen(true)}
            className="bg-rose-500 hover:bg-rose-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Your First Media
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <AnimatePresence mode="popLayout">
            {album.media.map((media, index) => (
              <motion.div
                key={media.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => handleMediaSelect(media, index)}
              >
                {media.type === "VIDEO" ? (
                  <>
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      onLoadStart={(e) =>
                        e.currentTarget.classList.add("opacity-0")
                      }
                      onLoadedData={(e) =>
                        e.currentTarget.classList.remove("opacity-0")
                      }
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <img
                    src={media.url}
                    alt=""
                    className="w-full h-full object-cover transition-opacity duration-200"
                    onLoadStart={(e) =>
                      e.currentTarget.classList.add("opacity-0")
                    }
                    onLoad={(e) =>
                      e.currentTarget.classList.remove("opacity-0")
                    }
                  />
                )}
                {/* Standard hover overlay */}
                {!(deletingMediaId === media.id && isDeletingMedia) && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                {/* Deleting state overlay and button */}
                {deletingMediaId === media.id && isDeletingMedia ? (
                  <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMediaToDelete(media);
                      setIsDeleteConfirmModalOpen(true);
                    }}
                    disabled={isDeletingMedia && deletingMediaId === media.id}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 disabled:opacity-50"
                    title="Delete Media"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Media Viewer Modal */}
      <Dialog
        open={!!selectedMedia}
        onOpenChange={() => setSelectedMedia(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none rounded-lg">
          <div className="sr-only">
            <DialogTitle>Media Viewer</DialogTitle>
          </div>
          <div className="relative">
            {/* Navigation Buttons */}
            {selectedMediaIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white bg-black/30 rounded-full w-10 h-10 z-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevMedia();
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            )}
            {selectedMediaIndex < album.media.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white bg-black/30 rounded-full w-10 h-10 z-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextMedia();
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}

            {selectedMedia?.type === "PHOTO" ? (
              <img
                src={selectedMedia.url}
                alt=""
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            ) : (
              <video
                src={selectedMedia?.url}
                controls
                className="w-full h-auto max-h-[80vh]"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Media Dialog */}
      {album && (
        <AddMediaDialog
          isOpen={isAddMediaDialogOpen}
          onClose={() => setIsAddMediaDialogOpen(false)}
          albumId={album.id}
          albumName={album.name}
          currentMediaCount={album._count.media}
          mediaLimit={album.mediaLimit}
          onUploadSuccess={() => {
            // Optional: any additional actions after successful upload from dialog
            // For example, if the dialog doesn't close itself, close it here:
            // setIsAddMediaDialogOpen(false);
          }}
        />
      )}

      {/* Delete Media Confirmation Modal */}
      {mediaToDelete && (
        <Dialog
          open={isDeleteConfirmModalOpen}
          onOpenChange={setIsDeleteConfirmModalOpen}
        >
          <DialogContent className="sm:max-w-md bg-white border-rose-100/50">
            <DialogHeader>
              <DialogTitle className="text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to delete this media item? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {/* Optional: Media Preview within modal */}
            <div className="my-4 p-2 border rounded-md bg-gray-50 max-h-[200px] overflow-hidden flex items-center justify-center">
              {mediaToDelete.type === "PHOTO" ? (
                <img
                  src={mediaToDelete.url}
                  alt="Media preview"
                  className="max-h-[180px] object-contain rounded"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <Film className="w-16 h-16 mb-2" />
                  <span>Video File</span>
                </div>
              )}
            </div>

            <DialogFooter className="mt-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmModalOpen(false)}
                disabled={
                  isDeletingMedia && deletingMediaId === mediaToDelete.id
                }
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  deleteMedia(mediaToDelete.id);
                  setIsDeleteConfirmModalOpen(false); // Close modal after initiating delete
                }}
                disabled={
                  isDeletingMedia && deletingMediaId === mediaToDelete.id
                }
              >
                {isDeletingMedia && deletingMediaId === mediaToDelete.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
