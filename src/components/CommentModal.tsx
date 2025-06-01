"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Loader2,
  Send,
  MessageSquareText,
  AlertTriangle,
  Trash2,
  MoreHorizontal,
  Edit3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useInView } from "react-intersection-observer";

const COMMENTS_PER_PAGE = 10;

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

type CommentModalProps = {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  initialCommentCount?: number;
  onEditComment?: (comment: Comment, postId: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
};

function CommentSkeletonItem() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-slate-100 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
      <div className="flex-1">
        <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
        <div className="h-3 bg-slate-200 rounded w-16 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-full mb-1"></div>
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  onDelete: (commentId: string) => void;
  onEdit?: (comment: Comment) => void;
  isDeleting: boolean;
  currentUserId: string | undefined;
}

function CommentItem({ comment, onDelete, onEdit, isDeleting, currentUserId }: CommentItemProps) {
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
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600">
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
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete Comment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-1.5">
          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
        </p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </motion.div>
  );
}

export default function CommentModal({
  postId,
  isOpen,
  onClose,
  initialCommentCount = 0,
  onEditComment,
  onDeleteComment,
}: CommentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useCurrentUser();
  const [commentText, setCommentText] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
    threshold: 0.5,
  });

  const {
    data: commentPages,
    fetchNextPage,
    hasNextPage,
    isLoading: isLoadingComments,
    isFetchingNextPage,
    isError: isCommentsError,
    error: commentsError,
    refetch: refetchComments,
  } = useInfiniteQuery<{
    comments: Comment[];
    nextPage?: number;
    totalComments: number;
  }>({
    queryKey: ["comments", postId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `/api/posts/${postId}/comments?page=${pageParam}&limit=${COMMENTS_PER_PAGE}`
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch comments");
      }
      return result.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: isOpen,
  });

  useEffect(() => {
    if (loadMoreInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [loadMoreInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allComments = commentPages?.pages.flatMap((page) => page.comments) || [];

  const addCommentMutation = useMutation({
    mutationFn: async (newComment: { content: string }) => {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComment),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error posting comment", description: error.message, variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      setDeletingCommentId(commentId);
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete comment" }));
        throw new Error(errorData.message);
      }
      if (response.status === 204) return null;
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast({ title: "Comment deleted", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting comment", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setDeletingCommentId(null);
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ content: commentText.trim() });
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit(e as any);
    }
  };

  const currentTotalFetchedComments = allComments.length;
  const actualTotalComments = commentPages?.pages[0]?.totalComments ?? initialCommentCount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] bg-slate-50 p-0 shadow-2xl rounded-xl flex flex-col h-[80vh] max-h-[700px]">
        <DialogHeader className="border-b border-slate-200 p-4 shrink-0">
          <DialogTitle className="text-lg font-semibold text-slate-700 text-center">
            Comments ({actualTotalComments})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto styled-scrollbar">
          {isLoadingComments && !allComments.length ? (
            <div className="py-2">
              {[...Array(5)].map((_, i) => <CommentSkeletonItem key={i} />)}
            </div>
          ) : isCommentsError ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
              <p className="font-semibold text-slate-700 mb-1">Error loading comments</p>
              <p className="text-sm text-slate-500 mb-4">
                {commentsError instanceof Error ? commentsError.message : "Something went wrong."}
              </p>
              <Button onClick={() => refetchComments()} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : !allComments.length && !isFetchingNextPage ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageSquareText className="w-16 h-16 text-slate-300 mb-4" />
              <p className="font-semibold text-slate-600">No comments yet</p>
              <p className="text-sm text-slate-400">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {allComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onDelete={onDeleteComment ? (commentId) => onDeleteComment(commentId, postId) : deleteCommentMutation.mutate}
                  onEdit={onEditComment ? (comment) => onEditComment(comment, postId) : undefined}
                  isDeleting={deleteCommentMutation.isPending && deletingCommentId === comment.id}
                  currentUserId={currentUser?.id}
                />
              ))}
            </AnimatePresence>
          )}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingNextPage ? (
                <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
              ) : (
                <span className="text-sm text-slate-500">Scroll to load more</span>
              )}
            </div>
          )}
          {!isLoadingComments && !isFetchingNextPage && !hasNextPage && allComments.length > 0 && actualTotalComments > COMMENTS_PER_PAGE && (
             <p className="text-center text-sm text-rose-500 pt-4">No more comments</p>
          )}
        </div>

        <form
          onSubmit={handleCommentSubmit}
          className="border-t border-slate-200 p-3 sm:p-4 bg-white shrink-0"
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <img
              src={currentUser?.imageUrl || "/placeholder-avatar.png"}
              alt="Your avatar"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 mt-0.5"
            />
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Add a comment... (Enter to send)"
              className="flex-1 bg-slate-100 border-slate-200 focus:ring-rose-500 focus:border-rose-500 resize-none min-h-[40px] text-sm py-2 sm:min-h-[44px]"
              rows={1}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-9 w-9 sm:h-10 sm:w-10 shrink-0"
              disabled={addCommentMutation.isPending || !commentText.trim()}
            >
              {addCommentMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
