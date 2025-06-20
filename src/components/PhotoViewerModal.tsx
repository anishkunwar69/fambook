"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

// Assuming Post type is similar to or can be imported from where it's defined (e.g., feed/page.tsx)
// For now, let's define it inline for clarity if not directly importable
// This should be synchronized with the Post type in feed/page.tsx
type PostUser = {
  id: string;
  fullName: string;
  imageUrl: string | null;
};

type PostMedia = {
  id: string;
  url: string;
  type: "PHOTO" | "VIDEO";
  caption: string | null;
};

type PostFamily = {
  id: string;
  name: string;
};

type PostCount = {
  likes: number;
  comments: number;
};

type Post = {
  id: string;
  text: string | null;
  media: PostMedia[];
  user: PostUser;
  family: PostFamily;
  createdAt: string;
  _count: PostCount;
  isLiked: boolean;
  isInMemory: boolean; // Assuming this might be relevant
};

// Comment type from CommentModal.tsx
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

const COMMENTS_PER_PAGE = 10; // From CommentModal.tsx

interface PhotoViewerModalProps {
  post: Post | null;
  initialMediaIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onLikePost: (postId: string) => void;
  isLikingStatus: boolean;
  onOpenLikesModal: (postId: string) => void;
  onEditComment?: (comment: Comment, postId: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
}

// CommentSkeletonItem from CommentModal.tsx
function CommentSkeletonItem() {
  return (
    <div className="flex items-start gap-3 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
        <div className="h-4 bg-slate-200 rounded w-full"></div>
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      </div>
    </div>
  );
}

// CommentItem from CommentModal.tsx
interface CommentItemProps {
  comment: Comment;
  onDelete: (commentId: string) => void;
  onEdit?: (comment: Comment) => void;
  isDeleting: boolean;
  currentUserId: string | undefined;
}

function CommentItem({
  comment,
  onDelete,
  onEdit,
  isDeleting,
  currentUserId,
}: CommentItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 p-4 border-b border-slate-100"
    >
      <img
        src={comment.user.imageUrl || "/placeholder-avatar.png"}
        alt={comment.user.fullName}
        className="w-10 h-10 rounded-full object-cover shrink-0"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-slate-800">
            {comment.user.fullName}
          </h4>
          {currentUserId === comment.user.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-slate-600"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem
                    onSelect={() => onEdit(comment)}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Comment
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={() => onDelete(comment.id)}
                  disabled={isDeleting}
                  className="cursor-pointer text-red-600 hover:!text-red-600 hover:!bg-red-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete Comment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-1.5">
          {formatDistanceToNow(new Date(comment.createdAt), {
            addSuffix: true,
          })}
        </p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </motion.div>
  );
}

export function PhotoViewerModal({
  post,
  initialMediaIndex = 0,
  isOpen,
  onClose,
  onLikePost,
  isLikingStatus,
  onOpenLikesModal,
  onEditComment,
  onDeleteComment,
}: PhotoViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialMediaIndex);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useCurrentUser();
  const [commentText, setCommentText] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );
  const commentInputRef = useRef<HTMLTextAreaElement>(null); // For focusing

  const { ref: loadMoreCommentsRef, inView: loadMoreCommentsInView } =
    useInView({
      threshold: 0.5,
    });

  useEffect(() => {
    if (post && initialMediaIndex < post.media.length) {
      setCurrentIndex(initialMediaIndex);
    } else {
      setCurrentIndex(0);
    }
    // Reset comment text when modal opens or post changes
    if (isOpen) {
      setCommentText("");
    }
  }, [initialMediaIndex, post, isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleNext = useCallback(() => {
    if (post && post.media.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % post.media.length);
    }
  }, [post]);

  const handlePrev = useCallback(() => {
    if (post && post.media.length > 0) {
      setCurrentIndex(
        (prevIndex) => (prevIndex - 1 + post.media.length) % post.media.length
      );
    }
  }, [post]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || !post) return;
      // Allow typing in textarea without triggering image navigation
      if (event.target === commentInputRef.current) {
        if (event.key === "Escape") {
          // if textarea is focused and escape is pressed, it will just blur.
          // To close modal, user has to press escape again when textarea is not focused.
          // Or click outside.
        } else {
          return;
        }
      }

      if (post.media.length > 1) {
        if (event.key === "ArrowRight") {
          handleNext();
        } else if (event.key === "ArrowLeft") {
          handlePrev();
        }
      }
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, post, handleNext, handlePrev, handleClose, commentInputRef]);

  // Fetch Comments
  const {
    data: commentPages,
    fetchNextPage: fetchNextCommentsPage,
    hasNextPage: hasNextCommentsPage,
    isLoading: isLoadingComments,
    isFetchingNextPage,
    isError: isCommentsError,
    error: commentsError,
    refetch: refetchComments,
  } = useInfiniteQuery<{
    comments: Comment[];
    nextPage?: number;
    totalComments: number; // Assuming API returns this
  }>({
    queryKey: ["comments", post?.id], // Depend on post.id
    queryFn: async ({ pageParam = 1 }) => {
      if (!post?.id) throw new Error("Post ID is required to fetch comments.");
      const response = await fetch(
        `/api/posts/${post.id}/comments?page=${pageParam}&limit=${COMMENTS_PER_PAGE}`
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error("Failed to fetch comments");
      }
      return result.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: isOpen && !!post?.id, // Only fetch if modal is open and post exists
  });

  useEffect(() => {
    if (loadMoreCommentsInView && hasNextCommentsPage && !isFetchingNextPage) {
      fetchNextCommentsPage();
    }
  }, [
    loadMoreCommentsInView,
    hasNextCommentsPage,
    isFetchingNextPage,
    fetchNextCommentsPage,
  ]);

  const allComments =
    commentPages?.pages.flatMap((page) => page.comments) || [];
  const totalCommentsCount =
    commentPages?.pages[0]?.totalComments ?? post?._count.comments ?? 0;

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: async (newComment: { content: string }) => {
      if (!post?.id) throw new Error("Post ID is required to add a comment.");
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComment),
      });
      const result = await response.json();
      if (!result.success) throw new Error("Failed to post comment");
      return result.data as Comment; // Assuming the API returns the created comment
    },
    onSuccess: (newCommentData) => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["comments", post?.id] });
      // Optimistically update the post's comment count in the main feed query if possible, or just invalidate
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      // Potentially update the comment count in the PhotoViewerModal's local post state if needed,
      // but query invalidation for 'comments' query should handle the list update.
      // And `totalCommentsCount` should update from the refetched `commentPages`.
      toast({ title: "Comment posted!", variant: "default" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error posting comment",
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  // Delete Comment Mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      setDeletingCommentId(commentId);
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to delete comment" }));
        throw new Error("Failed to delete comment");
      }
      // For 204 No Content, no JSON to parse
      if (response.status === 204) return null;
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", post?.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast({ title: "Comment deleted", variant: "default" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting comment",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingCommentId(null);
    },
  });

  const handleCommentSubmit = (e?: React.FormEvent) => {
    // Make e optional for direct calls
    e?.preventDefault();
    if (!commentText.trim() || !post?.id) return;
    addCommentMutation.mutate({ content: commentText.trim() });
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit();
    }
  };

  if (!isOpen || !post) {
    return null;
  }

  const currentMedia = post.media[currentIndex];

  const imageDisplayArea = (
    <div className="flex items-center justify-center relative h-[45vh] w-full lg:h-full lg:flex-1 lg:w-auto bg-black pt-0 pb-0 px-0 safe-area-inset-top">
      {currentMedia.type === "PHOTO" ? (
        <Image
          src={currentMedia.url}
          alt={currentMedia.caption || `Post media ${currentIndex + 1}`}
          fill
          className="object-contain"
          priority
          sizes="100vw"
          style={{ 
            objectFit: "contain",
            margin: "auto",
            maxHeight: "100%",
            maxWidth: "100%"
          }}
        />
      ) : (
        <video
          src={currentMedia.url}
          controls
          className="max-w-full max-h-full object-contain m-auto"
        />
      )}

      {post.media.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-black bg-white/50 hover:bg-white/80 rounded-full p-2 shadow-md"
          >
            <ChevronLeft className="w-7 h-7" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-black bg-white/50 hover:bg-white/80 rounded-full p-2 shadow-md"
          >
            <ChevronRight className="w-7 h-7" />
          </Button>
        </>
      )}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col w-full lg:w-[400px] lg:flex-none flex-1 min-h-0 lg:h-full bg-white text-gray-800 lg:border-l border-gray-200">
      {/* Header: User Info & Post Text */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={post.user.imageUrl || undefined}
              alt={post.user.fullName}
            />
            <AvatarFallback>
              {post.user.fullName
                ? post.user.fullName.charAt(0).toUpperCase()
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {post.user.fullName}
            </p>
            <p className="text-xs text-gray-500">
              {format(new Date(post.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        {post.text && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mt-2">
            {post.text}
          </p>
        )}
      </div>

      {/* Actions: Likes & Comments Count */}
      <div className="py-2 px-4 border-b border-gray-200 flex items-center justify-start gap-2">
        <button
          onClick={() => onLikePost(post.id)}
          disabled={isLikingStatus}
          className="flex items-center gap-1.5 text-gray-600 hover:text-rose-600 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Heart
            className={`w-5 h-5 group-hover:text-rose-500 ${post.isLiked ? "fill-rose-500 text-rose-500" : "text-gray-400"}`}
          />
        </button>
        <button
          onClick={() => post._count.likes > 0 && onOpenLikesModal(post.id)} // Only open if likes > 0
          className="text-sm font-medium text-gray-600 hover:text-rose-600 disabled:cursor-default disabled:hover:text-gray-600"
          disabled={post._count.likes === 0}
        >
          {post._count.likes} {post._count.likes === 1 ? "like" : "likes"}
        </button>
        {/* Comment Icon - now just visual or could scroll to comments */}
        <div className="flex items-center gap-1.5 text-gray-600 group">
          <MessageCircle className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium">
            {totalCommentsCount}{" "}
            {totalCommentsCount === 1 ? "comment" : "comments"}
          </span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="flex-grow p-0 flex flex-col overflow-hidden min-h-0"> 
        <div className="flex-grow overflow-y-auto styled-scrollbar min-h-0"> 
          <AnimatePresence mode="popLayout">
            {isLoadingComments && !allComments.length ? (
              <div className="py-2">
                {[...Array(3)].map((_, i) => (
                  <CommentSkeletonItem key={`skeleton-${i}`} />
                ))}
              </div>
            ) : isCommentsError ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
                <p className="font-semibold text-slate-700 mb-1">
                  Error loading comments
                </p>
                <p className="text-sm text-slate-500 mb-3">
                  {commentsError instanceof Error
                    ? commentsError.message
                    : "Something went wrong."}
                </p>
                <Button
                  onClick={() => refetchComments()}
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            ) : allComments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
                <MessageCircle className="w-10 h-10 mb-3" />
                <p className="font-semibold text-slate-700 mb-1">
                  No comments yet
                </p>
                <p className="text-sm">Be the first to share your thoughts!</p>
              </div>
            ) : (
              allComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onDelete={
                    onDeleteComment
                      ? (commentId) => onDeleteComment(commentId, post!.id)
                      : () => deleteCommentMutation.mutate(comment.id)
                  }
                  onEdit={
                    onEditComment
                      ? (comment) => onEditComment(comment, post!.id)
                      : undefined
                  }
                  isDeleting={
                    deleteCommentMutation.isPending &&
                    deletingCommentId === comment.id
                  }
                  currentUserId={currentUser?.id}
                />
              ))
            )}
          </AnimatePresence>
          {/* Load More Trigger for Comments */}
          <div
            ref={loadMoreCommentsRef}
            className="h-6 flex justify-center items-center"
          >
            {isFetchingNextPage && (
              <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
            )}
            {!hasNextCommentsPage &&
              allComments.length > 0 &&
              !isLoadingComments &&
              !isFetchingNextPage && (
                <span className="text-xs text-slate-400">
                  All comments loaded.
                </span>
              )}
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <form
        onSubmit={handleCommentSubmit}
        className="p-2 border-t border-gray-200 bg-slate-50/50 mt-auto shrink-0"
      >
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6 shrink-0">
            <AvatarImage src={currentUser?.imageUrl || undefined} />
            <AvatarFallback>
              {currentUser?.fullName
                ? currentUser.fullName.charAt(0).toUpperCase()
                : "U"}
            </AvatarFallback>
          </Avatar>
          <Textarea
            ref={commentInputRef}
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 resize-none text-sm focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:border-rose-500 min-h-[36px] py-2"
            rows={1} // Start with 1 row, can expand if needed or make it a fixed height
            disabled={addCommentMutation.isPending}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="text-rose-500 hover:text-rose-600 disabled:text-gray-400 h-8 w-8"
            disabled={!commentText.trim() || addCommentMutation.isPending}
          >
            {addCommentMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="bg-white dark:bg-slate-900 flex flex-col rounded-none max-h-[100dvh] p-0 overflow-hidden" 
        fullWidth={true}
        hideCloseButton={true}
      >
        <VisuallyHidden>
          <DialogTitle>Media Viewer</DialogTitle>
        </VisuallyHidden>
        
        {/* Close button as a separate element outside the main content */}
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none w-full">
          <div className="absolute sm:top-4 top-2 right-4 pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              className="lg:bg-black/70 text-white rounded-full h-10 w-10 shadow-lg"
              onClick={handleClose}
              aria-label="Close viewer"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative h-full w-full">
          {/* Image/Video view */}
          <div className="flex-1 lg:w-[calc(100%-420px)] bg-black/95 dark:bg-black/90 flex items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {imageDisplayArea}
              </motion.div>
            </AnimatePresence>
          </div>

          {sidebarContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
