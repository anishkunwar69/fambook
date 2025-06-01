"use client";

import { AdvancedCreatePostModal } from "@/components/AdvancedCreatePostModal";
import CommentModal from "@/components/CommentModal";
import { DeletePostConfirmationModal } from "@/components/DeletePostConfirmationModal";
import { DeleteCommentConfirmationModal } from "@/components/DeleteCommentConfirmationModal";
import { EditPostModal } from "@/components/EditPostModal";
import { EditCommentModal } from "@/components/EditCommentModal";
import LikesModal from "@/components/LikesModal";
import { PhotoViewerModal } from "@/components/PhotoViewerModal";
import { AddToMemoryButton } from "@/components/shared/AddToMemoryButton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Filter,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useInView } from "react-intersection-observer";

type Post = {
  id: string;
  text: string | null;
  media: {
    id: string;
    url: string;
    type: "PHOTO" | "VIDEO";
    caption: string | null;
  }[];
  user: {
    id: string;
    fullName: string;
    imageUrl: string | null;
  };
  family: {
    id: string;
    name: string;
  };
  createdAt: string;
  _count: {
    likes: number;
    comments: number;
  };
  isLiked: boolean;
  isInMemory: boolean;
};

type Family = {
  id: string;
  name: string;
  userMembershipStatus?: "APPROVED" | "PENDING" | null;
};

// Skeleton Card Component for Posts
function PostSkeletonCard() {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-gray-200 animate-pulse">
      {/* Skeleton Post Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
        <div>
          <div className="h-5 bg-gray-200 rounded w-32 mb-1.5"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>

      {/* Skeleton Post Text */}
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>

      {/* Skeleton Media Grid */}
      <div className="aspect-square rounded-lg bg-gray-200 mb-4"></div>

      {/* Skeleton Post Actions */}
      <div className="flex items-center gap-6">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
}

interface UserPostsTabProps {
  userId: string;
  isCurrentUser: boolean;
}

export function UserPostsTab({ userId, isCurrentUser }: UserPostsTabProps) {
  const queryClient = useQueryClient();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("all");
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [commentModalState, setCommentModalState] = useState<{
    isOpen: boolean;
    postId: string | null;
  }>({ isOpen: false, postId: null });
  const [likesModalState, setLikesModalState] = useState<{
    isOpen: boolean;
    postId: string | null;
  }>({ isOpen: false, postId: null });

  // States for Edit Post Modal
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [selectedPostForEditing, setSelectedPostForEditing] =
    useState<Post | null>(null);

  // State for Photo Viewer Modal
  const [photoViewerState, setPhotoViewerState] = useState<{
    isOpen: boolean;
    post: Post | null;
    initialMediaIndex: number;
  }>({ isOpen: false, post: null, initialMediaIndex: 0 });

  // States and Handlers for Delete Post Modal
  const [isDeletePostModalOpen, setIsDeletePostModalOpen] = useState(false);
  const [selectedPostIdForDeletion, setSelectedPostIdForDeletion] = useState<
    string | null
  >(null);

  // States for Comment Edit and Delete Modals
  const [editCommentModalState, setEditCommentModalState] = useState<{
    isOpen: boolean;
    comment: any | null;
    postId: string | null;
  }>({ isOpen: false, comment: null, postId: null });

  const [deleteCommentModalState, setDeleteCommentModalState] = useState<{
    isOpen: boolean;
    commentId: string | null;
    postId: string | null;
  }>({ isOpen: false, commentId: null, postId: null });

  const POSTS_PER_PAGE = 10;

  // Intersection observer for infinite scrolling
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
  });

  // Fetch user's families
  const { data: families } = useQuery<Family[]>({
    queryKey: ["families"],
    queryFn: async () => {
      const response = await fetch("/api/families");
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  // Fetch user posts with pagination
  const {
    data: postsPages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["userPosts", userId, selectedFamilyId],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        limit: POSTS_PER_PAGE.toString(),
      });

      if (selectedFamilyId && selectedFamilyId !== "all") {
        searchParams.append("familyId", selectedFamilyId);
      }

      const response = await fetch(`/api/users/${userId}/posts?${searchParams}`);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === POSTS_PER_PAGE
        ? allPages.length + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  // Load more posts when scrolling to the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Like post mutation
  const { mutate: likePost } = useMutation({
    mutationFn: async (postId: string) => {
      setLikingPosts((prev) => new Set(prev).add(postId));
      try {
        const response = await fetch(`/api/posts/${postId}/like`, {
          method: "POST",
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message);
        }
        return result.data;
      } finally {
        setLikingPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    },
    onMutate: async (postId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["userPosts", userId] });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(["userPosts", userId]);

      // Optimistically update posts
      queryClient.setQueryData(["userPosts", userId], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          pages: old.pages.map((page: Post[]) =>
            page.map((post: Post) =>
              post.id === postId
                ? {
                    ...post,
                    isLiked: !post.isLiked,
                    _count: {
                      ...post._count,
                      likes: post.isLiked 
                        ? post._count.likes - 1 
                        : post._count.likes + 1,
                    },
                  }
                : post
            )
          ),
        };
      });

      // Update photo viewer state if it's open and shows this post
      if (photoViewerState.isOpen && photoViewerState.post?.id === postId) {
        setPhotoViewerState(prev => ({
          ...prev,
          post: prev.post ? {
            ...prev.post,
            isLiked: !prev.post.isLiked,
            _count: {
              ...prev.post._count,
              likes: prev.post.isLiked 
                ? prev.post._count.likes - 1 
                : prev.post._count.likes + 1,
            },
          } : null,
        }));
      }

      return { previousPosts };
    },
    onError: (error: Error, postId: string, context: any) => {
      // Revert optimistic update on error
      if (context?.previousPosts) {
        queryClient.setQueryData(["userPosts", userId], context.previousPosts);
      }
      
      // Revert photo viewer state if needed
      if (photoViewerState.isOpen && photoViewerState.post?.id === postId) {
        setPhotoViewerState(prev => ({
          ...prev,
          post: prev.post ? {
            ...prev.post,
            isLiked: !prev.post.isLiked,
            _count: {
              ...prev.post._count,
              likes: prev.post.isLiked 
                ? prev.post._count.likes - 1 
                : prev.post._count.likes + 1,
            },
          } : null,
        }));
      }
      
      toast.error("Failed to like post. Please try again.");
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["userPosts", userId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  // Mutation for deleting a post
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!postId) throw new Error("Post ID is required for deletion.");
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      if (response.status === 204) {
        return { success: true };
      }
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({
            message: "Failed to delete post. Please try again.",
          }));
        throw new Error(
          errorData.message || "Failed to delete post. Please try again."
        );
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPosts", userId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post deleted successfully!");
      setIsDeletePostModalOpen(false);
      setSelectedPostIdForDeletion(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete post. Please try again.");
    },
  });

  // Get all posts from all pages
  const allPosts = postsPages?.pages.flat() || [];

  // Handlers for Comment and Likes Modals
  const handleOpenCommentModal = (postId: string) => {
    setCommentModalState({ isOpen: true, postId });
  };

  const handleOpenLikesModal = (postId: string) => {
    setLikesModalState({ isOpen: true, postId });
  };

  // Handler for Photo Viewer Modal
  const openPhotoViewer = (post: Post, initialMediaIndex: number) => {
    setPhotoViewerState({ isOpen: true, post, initialMediaIndex });
  };

  const closePhotoViewer = () => {
    setPhotoViewerState({ isOpen: false, post: null, initialMediaIndex: 0 });
  };

  // Handlers for Edit Post Modal
  const handleOpenEditModal = (post: Post) => {
    setSelectedPostForEditing(post);
    setIsEditPostModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditPostModalOpen(false);
    setSelectedPostForEditing(null);
  };

  const handleOpenDeleteModal = (postId: string) => {
    setSelectedPostIdForDeletion(postId);
    setIsDeletePostModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeletePostModalOpen(false);
    setSelectedPostIdForDeletion(null);
  };

  const handleConfirmDeletePost = () => {
    if (selectedPostIdForDeletion) {
      deletePostMutation.mutate(selectedPostIdForDeletion);
    }
  };

  // Comment Edit and Delete Handlers
  const handleOpenEditCommentModal = (comment: any, postId: string) => {
    setEditCommentModalState({ isOpen: true, comment, postId });
  };

  const handleCloseEditCommentModal = () => {
    setEditCommentModalState({ isOpen: false, comment: null, postId: null });
  };

  const handleOpenDeleteCommentModal = (commentId: string, postId: string) => {
    setDeleteCommentModalState({ isOpen: true, commentId, postId });
  };

  const handleCloseDeleteCommentModal = () => {
    setDeleteCommentModalState({ isOpen: false, commentId: null, postId: null });
  };

  const handleConfirmDeleteComment = () => {
    if (deleteCommentModalState.commentId) {
      deleteCommentMutation.mutate(deleteCommentModalState.commentId);
    }
  };

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
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
      if (deleteCommentModalState.postId) {
        queryClient.invalidateQueries({ queryKey: ["comments", deleteCommentModalState.postId] });
      }
      queryClient.invalidateQueries({ queryKey: ["userPosts", userId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Comment deleted successfully!");
      handleCloseDeleteCommentModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete comment");
      handleCloseDeleteCommentModal();
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-lora">
            {isCurrentUser ? "My Posts" : "Posts"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Family Filter */}
          <Select
            value={selectedFamilyId}
            onValueChange={setSelectedFamilyId}
          >
            <SelectTrigger className="w-[200px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="All families" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  All families
                </div>
              </SelectItem>
              {families?.map((family) => (
                <SelectItem key={family.id} value={family.id}>
                  {family.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

            {isCurrentUser && (
              <Button
                className="bg-rose-500 hover:bg-rose-600 flex items-center gap-2"
                onClick={() => setIsCreatePostOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Create Post
              </Button>
            )}
          </div>
        </div>

        {/* Posts Section */}
        {isLoading ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {[...Array(3)].map((_, index) => (
              <PostSkeletonCard key={index} />
            ))}
          </div>
        ) : isError ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50/50 backdrop-blur-md rounded-2xl p-12 text-center border border-red-100/50 text-red-700"
          >
            <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-lora font-bold text-red-800 mb-2">
              Failed to Load Posts
            </h3>
            <p className="text-red-600 max-w-md mx-auto mb-6">
              {error instanceof Error
                ? error.message
                : "An unknown error occurred while fetching posts."}
            </p>
            <Button
              onClick={() => refetch()}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Retry
            </Button>
          </motion.div>
        ) : !allPosts.length ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-12 text-center border border-rose-100/50"
          >
            <div className="bg-rose-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Send className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-lora font-bold text-gray-800 mb-2">
              {selectedFamilyId && selectedFamilyId !== "all" ? "No Posts in This Family" : "No Posts Yet"}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {selectedFamilyId && selectedFamilyId !== "all"
                ? "No posts found in the selected family. Try selecting a different family or clear the filter."
                : isCurrentUser 
                  ? "Start sharing moments with your family by creating your first post!"
                  : "This user hasn't shared any posts yet."}
            </p>
            {isCurrentUser && (!selectedFamilyId || selectedFamilyId === "all") && (
              <Button
                className="bg-rose-500 hover:bg-rose-600 flex items-center gap-2"
                onClick={() => setIsCreatePostOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Create First Post
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <AnimatePresence mode="popLayout">
              {allPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => likePost(post.id)}
                  isLiking={likingPosts.has(post.id)}
                  onOpenCommentModal={handleOpenCommentModal}
                  onOpenLikesModal={handleOpenLikesModal}
                  onOpenDeleteModal={handleOpenDeleteModal}
                  onOpenEditModal={handleOpenEditModal}
                  onOpenPhotoViewer={openPhotoViewer}
                  isCurrentUser={isCurrentUser}
                  onEditComment={handleOpenEditCommentModal}
                  onDeleteComment={handleOpenDeleteCommentModal}
                />
              ))}
            </AnimatePresence>

            {/* Load More Trigger */}
            <div ref={loadMoreRef} className="pt-8 flex justify-center">
              {isFetchingNextPage ? (
                <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
              ) : hasNextPage ? (
                <span className="text-gray-500">Loading more posts...</span>
              ) : allPosts.length > 0 ? (
                <span className="flex items-center gap-2 text-sm text-rose-600 px-4 py-2 bg-rose-50 rounded-full border border-rose-200 shadow-sm">
                  <span className="text-2xl">🫶🏻</span>
                  No more posts to load
                </span>
              ) : null}
            </div>
          </div>
        )}
      

      {/* Modals */}
      {isCurrentUser && (
        <AdvancedCreatePostModal
          isOpen={isCreatePostOpen}
          onClose={() => setIsCreatePostOpen(false)}
          families={families}
        />
      )}

      {commentModalState.isOpen && commentModalState.postId && (
        <CommentModal
          postId={commentModalState.postId}
          isOpen={commentModalState.isOpen}
          onClose={() => setCommentModalState({ isOpen: false, postId: null })}
          onEditComment={handleOpenEditCommentModal}
          onDeleteComment={handleOpenDeleteCommentModal}
        />
      )}
      
      {likesModalState.isOpen && likesModalState.postId && (
        <LikesModal
          postId={likesModalState.postId}
          isOpen={likesModalState.isOpen}
          onClose={() => setLikesModalState({ isOpen: false, postId: null })}
        />
      )}
      
      <DeletePostConfirmationModal
        isOpen={isDeletePostModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirmDelete={handleConfirmDeletePost}
        isDeleting={deletePostMutation.isPending}
      />
      
      <EditPostModal
        isOpen={isEditPostModalOpen}
        onClose={handleCloseEditModal}
        postToEdit={selectedPostForEditing}
      />
      
      <PhotoViewerModal
        isOpen={photoViewerState.isOpen}
        post={photoViewerState.post}
        initialMediaIndex={photoViewerState.initialMediaIndex}
        onClose={closePhotoViewer}
        onLikePost={(postId) => likePost(postId)}
        isLikingStatus={
          photoViewerState.post
            ? likingPosts.has(photoViewerState.post.id)
            : false
        }
        onOpenLikesModal={handleOpenLikesModal}
        onEditComment={handleOpenEditCommentModal}
        onDeleteComment={handleOpenDeleteCommentModal}
      />

      {/* Comment Edit and Delete Modals */}
      <EditCommentModal
        isOpen={editCommentModalState.isOpen}
        onClose={handleCloseEditCommentModal}
        comment={editCommentModalState.comment}
        postId={editCommentModalState.postId || ""}
      />

      <DeleteCommentConfirmationModal
        isOpen={deleteCommentModalState.isOpen}
        onClose={handleCloseDeleteCommentModal}
        onConfirmDelete={handleConfirmDeleteComment}
        isDeleting={deleteCommentMutation.isPending}
      />
    </div>
  );
}

function PostCard({
  post,
  onLike,
  isLiking,
  onOpenCommentModal,
  onOpenLikesModal,
  onOpenDeleteModal,
  onOpenEditModal,
  onOpenPhotoViewer,
  isCurrentUser,
  onEditComment,
  onDeleteComment,
}: {
  post: Post;
  onLike: (id: string) => void;
  isLiking: boolean;
  onOpenCommentModal: (postId: string) => void;
  onOpenLikesModal: (postId: string) => void;
  onOpenDeleteModal: (postId: string) => void;
  onOpenEditModal: (post: Post) => void;
  onOpenPhotoViewer: (post: Post, initialMediaIndex: number) => void;
  isCurrentUser: boolean;
  onEditComment?: (comment: any, postId: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const { user: currentUser } = useCurrentUser();

  const MAX_VISIBLE_CELLS = 4;
  const IMAGES_IN_CELLS_BEFORE_OVERLAY = 3;

  let gridContainerClass = "grid gap-1 mb-4";
  if (post.media.length === 1) {
    gridContainerClass += " grid-cols-1";
  } else {
    gridContainerClass += " grid-cols-2";
  }

  const directMediaItems = post.media.slice(
    0,
    post.media.length > MAX_VISIBLE_CELLS
      ? IMAGES_IN_CELLS_BEFORE_OVERLAY
      : post.media.length
  );

  const showOverlay = post.media.length > MAX_VISIBLE_CELLS;
  const overlayCount = post.media.length - IMAGES_IN_CELLS_BEFORE_OVERLAY;
  const overlayBackgroundImageUrl = showOverlay
    ? post.media[IMAGES_IN_CELLS_BEFORE_OVERLAY]?.url
    : undefined;
  const overlayClickIndex = IMAGES_IN_CELLS_BEFORE_OVERLAY;

  const handleLike = () => {
    onLike(post.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-rose-100/50"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <img
            src={post.user.imageUrl || "/placeholder-avatar.png"}
            alt={post.user.fullName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-gray-800">{post.user.fullName}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link
                href={`/families/${post.family.id}`}
                className="hover:text-rose-500 transition-colors"
              >
                {post.family.name}
              </Link>
              <span>•</span>
              <span>{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
        {currentUser && currentUser.id === post.user.id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => onOpenEditModal(post)}
                className="cursor-pointer"
              >
                Edit Post
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onOpenDeleteModal(post.id)}
                className="cursor-pointer text-red-600 hover:!text-red-600 hover:!bg-red-50"
              >
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Post Content */}
      {post.text && (
        <p className="text-gray-600 mb-4 whitespace-pre-wrap">{post.text}</p>
      )}

      {/* Media Grid */}
      {post.media.length > 0 && (
        <div className={gridContainerClass}>
          {directMediaItems.map((media, index) => (
            <div
              key={media.id}
              className="relative aspect-square rounded-md overflow-hidden group cursor-pointer"
              onClick={() => onOpenPhotoViewer(post, index)}
            >
              {media.type === "VIDEO" ? (
                <video
                  src={media.url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={media.url}
                  alt={media.caption || "Post image"}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              )}
            </div>
          ))}
          {showOverlay && overlayBackgroundImageUrl && (
            <div
              className="relative aspect-square rounded-md overflow-hidden group cursor-pointer bg-gray-800"
              onClick={() => onOpenPhotoViewer(post, overlayClickIndex)}
            >
              <Image
                src={overlayBackgroundImageUrl}
                alt={`View ${overlayCount} more`}
                fill
                className="object-cover opacity-50 group-hover:opacity-40 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  +{overlayCount}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-6 text-gray-500 border-t border-gray-100 mt-6">
        {/* Left side: Likes and Comments */}
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex items-center gap-1.5 hover:text-rose-500 transition-colors relative rounded-md px-2 py-1.5 hover:bg-rose-50/70 group"
                    onClick={handleLike}
                    disabled={isLiking}
                  >
                    <div className="relative">
                      <Heart
                        className={`w-5 h-5 transition-all group-hover:scale-110 ${
                          post.isLiked
                            ? "fill-rose-500 text-rose-500"
                            : "text-gray-400 group-hover:text-rose-400"
                        } ${isLiking ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{post.isLiked ? "Unlike" : "Like"} this post</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (post._count.likes > 0) {
                        setShowLikesModal(true);
                      }
                    }}
                    className={`text-sm font-medium ${
                      post.isLiked
                        ? "text-rose-600"
                        : "text-gray-500 group-hover:text-rose-500"
                    } ${
                      post._count.likes === 0
                        ? "cursor-default"
                        : "hover:underline"
                    } rounded-md px-1 py-1.5`}
                    disabled={post._count.likes === 0}
                  >
                    {post._count.likes}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View who liked this</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center gap-1.5 hover:text-blue-500 transition-colors rounded-md px-2 py-1.5 hover:bg-blue-50/70 group"
                  onClick={() => setShowComments(true)}
                >
                  <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-500 group-hover:text-blue-500">
                    {post._count.comments}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View or add comments</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Right side: Add To Memory Button */}
        <AddToMemoryButton
          itemId={post.id}
          itemType="post"
          variant="default"
          size="sm"
          className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/80 shadow-sm hover:shadow-md transition-all rounded-lg"
          initialIsInMemory={post.isInMemory}
        />
      </div>

      {/* Comment Modal */}
      <CommentModal
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
      />

      {/* Likes Modal */}
      <LikesModal
        postId={post.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        initialLikeCount={post._count.likes}
      />
    </motion.div>
  );
} 