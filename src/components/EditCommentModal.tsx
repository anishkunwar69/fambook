"use client";

import React, { useState, useEffect } from "react";
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
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    imageUrl: string | null;
  };
};

interface EditCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: Comment | null;
  postId: string;
}

export function EditCommentModal({
  isOpen,
  onClose,
  comment,
  postId,
}: EditCommentModalProps) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form when modal opens or comment changes
  useEffect(() => {
    if (isOpen && comment) {
      setCommentText(comment.content);
      setFormError(null);
    }
  }, [isOpen, comment]);

  // Clear error when text changes
  useEffect(() => {
    if (commentText.trim()) {
      setFormError(null);
    }
  }, [commentText]);

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async () => {
      if (!comment) throw new Error("Comment not found");
      
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to update comment");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts", postId] });
      toast.success("Comment updated successfully!");
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update comment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      setFormError("Comment cannot be empty");
      return;
    }
    
    if (commentText.trim() === comment?.content) {
      // No changes made, just close the modal
      onClose();
      return;
    }
    
    setFormError(null);
    updateCommentMutation.mutate();
  };

  // Prevent closing when updating is in progress
  const handleOpenChange = (open: boolean) => {
    if (!open && !updateCommentMutation.isPending) {
      onClose();
    }
  };

  if (!comment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Comment</DialogTitle>
          <DialogDescription>
            Make changes to your comment below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Comment
            </label>
            <Textarea
              placeholder="Write your comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[100px] bg-gray-50/50 border-0 focus-visible:ring-1 focus-visible:ring-rose-500 resize-none"
              disabled={updateCommentMutation.isPending}
              maxLength={1000}
            />
            <div className="text-xs text-right text-gray-500">
              {commentText.length}/1000 characters
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={updateCommentMutation.isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={updateCommentMutation.isPending || !commentText.trim()}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {updateCommentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 