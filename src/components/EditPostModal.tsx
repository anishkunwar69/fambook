"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; // Might need if we allow editing captions later
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Loader2,
  Send,
  Upload,
  X,
  Image as ImageIcon,
  AlertTriangle,
  Users,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

// Assuming Post and Family types are available or defined similarly to FeedPage
// For simplicity, defining inline, but ideally, these come from a shared types file
type MediaItem = {
  id: string;
  url: string;
  type: "PHOTO" | "VIDEO";
  caption: string | null;
};

type PostToEdit = {
  id: string;
  text: string | null;
  media: MediaItem[];
  family: {
    id: string;
    name: string;
  };
  // Add other necessary fields if CreatePostModal uses them from a full Post type
};

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postToEdit: PostToEdit | null;
}

export function EditPostModal({
  isOpen,
  onClose,
  postToEdit,
}: EditPostModalProps) {
  const queryClient = useQueryClient();
  const [text, setText] = useState<string>("");
  const [existingMedia, setExistingMedia] = useState<MediaItem[]>([]);
  const [mediaToRemove, setMediaToRemove] = useState<Set<string>>(new Set()); // Store IDs of media to remove
  const [newlySelectedFiles, setNewlySelectedFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && postToEdit) {
      setText(postToEdit.text || "");
      setExistingMedia(postToEdit.media || []);
      setMediaToRemove(new Set());
      setNewlySelectedFiles([]);
      setNewPreviews([]);
      setFormError(null);
    } else if (!isOpen) {
      // Reset form when modal is closed externally
      setText("");
      setExistingMedia([]);
      setMediaToRemove(new Set());
      setNewlySelectedFiles([]);
      setNewPreviews([]);
      setFormError(null);
    }
  }, [isOpen, postToEdit]);

  // Clear form error when relevant fields change
  useEffect(() => {
    if (text || existingMedia.length > 0 || newlySelectedFiles.length > 0) {
      setFormError(null);
    }
  }, [text, existingMedia, newlySelectedFiles]);


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewlySelectedFiles((prev) => [...prev, ...files]);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeNewFile = (index: number) => {
    setNewlySelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleMediaForRemoval = (mediaId: string) => {
    setMediaToRemove((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId);
      } else {
        newSet.add(mediaId);
      }
      return newSet;
    });
  };

  const updatePostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!postToEdit) throw new Error("No post selected for editing.");
      const response = await fetch(`/api/posts/${postToEdit.id}`, {
        method: "PUT",
        body: formData,
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to update post.");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      toast.success("Post updated successfully!");
      onClose(); // Close modal on success
    },
    onError: (error: Error) => {
      setFormError(error.message || "An unexpected error occurred.");
      toast.error(error.message || "Error updating post.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postToEdit) return;

    const currentMediaCount = existingMedia.filter(m => !mediaToRemove.has(m.id)).length + newlySelectedFiles.length;
    if (!text.trim() && currentMediaCount === 0) {
      setFormError("Please add some text or media to your post.");
      return;
    }
    setFormError(null);

    const formData = new FormData();
    formData.append("text", text.trim());
    
    // Append IDs of media to remove
    mediaToRemove.forEach(id => formData.append("mediaToRemove[]", id));
    
    // Append new media files
    newlySelectedFiles.forEach((file) => {
      formData.append("newMediaFiles", file);
    });

    updatePostMutation.mutate(formData);
  };

  // Prevent closing when update is in progress
  const handleOpenChange = (open: boolean) => {
    if (!open && !updatePostMutation.isPending) {
      onClose();
    }
  };

  if (!postToEdit) return null; // Should not happen if isOpen is true with a post

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="mt-3">
          <DialogTitle>Edit Post 🖋️</DialogTitle>
          <DialogDescription>
            Make changes to your post. The post will remain in the <span className="font-semibold text-rose-500">{postToEdit.family.name}</span> family.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {formError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 bg-red-50 p-3 rounded-md flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {formError}
            </motion.p>
          )}

          <div className="space-y-1">
            <label htmlFor="postTextEdit" className="text-sm font-medium text-gray-700">
              Your thoughts...
            </label>
            <Textarea
              id="postTextEdit"
              placeholder="What\'s on your mind?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px] bg-gray-50/50 border-gray-200 focus-visible:ring-1 focus-visible:ring-rose-500 resize-none"
            />
          </div>
          
          {/* Existing Media Display */}
          {existingMedia.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium text-gray-700">Current Media:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {existingMedia.map((media) => (
                  <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden group">
                    {media.type === "VIDEO" ? (
                       <video src={media.url} className="w-full h-full object-cover bg-black" controls />
                    ) : (
                      <img src={media.url} alt={media.caption || "Existing media"} className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => toggleMediaForRemoval(media.id)}
                      className={`absolute top-1.5 right-1.5 p-1.5 rounded-full text-white transition-colors text-xs
                                  ${mediaToRemove.has(media.id) 
                                    ? "bg-red-500 hover:bg-red-600" 
                                    : "bg-black/50 hover:bg-black/70"}`}
                      title={mediaToRemove.has(media.id) ? "Undo remove" : "Mark for removal"}
                    >
                      {mediaToRemove.has(media.id) ? <Trash2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </button>
                    {mediaToRemove.has(media.id) && (
                        <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                            <p className="text-white text-xs font-semibold">Marked for removal</p>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Media Upload Section */}
          <div className="space-y-2 pt-2">
             <p className="text-sm font-medium text-gray-700">Add New Media:</p>
            {newPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                {newPreviews.map((previewUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={previewUrl} alt={`New preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                        type="button"
                        onClick={() => removeNewFile(index)}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                    </div>
                ))}
                </div>
            )}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept="image/*,video/*"
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 w-full justify-center border-dashed hover:border-solid border-gray-300 hover:border-rose-400 hover:text-rose-500"
            >
                <Upload className="w-4 h-4" />
                Select Files to Add
            </Button>
          </div>


          <DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button variant="outline" onClick={onClose} disabled={updatePostMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={updatePostMutation.isPending || (!text.trim() && existingMedia.filter(m => !mediaToRemove.has(m.id)).length === 0 && newlySelectedFiles.length === 0)}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {updatePostMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 