"use client";

import { AdvancedCreatePostModal } from "@/components/AdvancedCreatePostModal";
import CommentModal from "@/components/CommentModal";
import { DeleteCommentConfirmationModal } from "@/components/DeleteCommentConfirmationModal";
import { DeletePostConfirmationModal } from "@/components/DeletePostConfirmationModal";
import { EditCommentModal } from "@/components/EditCommentModal";
import { EditPostModal } from "@/components/EditPostModal";
import LikesModal from "@/components/LikesModal";
import { PhotoViewerModal } from "@/components/PhotoViewerModal";
import { AddToMemoryButton } from "@/components/shared/AddToMemoryButton";
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
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowUp,
  Check,
  ChevronRight,
  Heart,
  Home,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Upload,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useInView } from "react-intersection-observer";

// Add debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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

function CreatePostModal({
  isOpen,
  onClose,
  selectedFamily,
  families,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedFamily: string | null;
  families: Family[] | undefined;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [postToFamilies, setPostToFamilies] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset selected families and error when modal opens
  useEffect(() => {
    if (isOpen) {
      setPostToFamilies(selectedFamily ? new Set([selectedFamily]) : new Set());
      setFormError(null); // Clear error on open
    }
  }, [isOpen, selectedFamily]);

  // Clear error when relevant fields change
  useEffect(() => {
    if (postToFamilies.size > 0) {
      setFormError(null);
    }
  }, [postToFamilies]);

  useEffect(() => {
    if (text || selectedFiles.length > 0) {
      setFormError(null);
    }
  }, [text, selectedFiles]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
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

  // Create post mutation
  const { mutate: createPost, isPending } = useMutation({
    mutationFn: async () => {
      const results = await Promise.all(
        Array.from(postToFamilies).map(async (familyId) => {
          const formData = new FormData();
          formData.append("text", text);
          selectedFiles.forEach((file) => {
            formData.append("media", file);
          });

          const response = await fetch(`/api/families/${familyId}/posts`, {
            method: "POST",
            body: formData,
          });

          const result = await response.json();
          if (!result.success) {
            throw new Error("Failed to create post");
          }
          return result.data;
        })
      );

      return results;
    },
    onSuccess: () => {
      setText("");
      setSelectedFiles([]);
      setPreviews([]);
      setPostToFamilies(new Set());
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post created successfully!");
      onClose();
    },
    onError: (error: Error) => {
      toast.error("Failed to create post");
    },
  });

  // Handle post submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (postToFamilies.size === 0) {
      setFormError("Please select at least one family to post to");
      return;
    }
    if (!text && selectedFiles.length === 0) {
      setFormError("Please add some text or media to your post");
      return;
    }
    setFormError(null); // Clear error before submitting
    createPost();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Create a Post
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Family Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Post to:
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-10 sm:h-auto"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Users className="w-4 h-4 shrink-0" />
                    <span className="truncate text-sm sm:text-base">
                      {postToFamilies.size === 0
                        ? "Select families..."
                        : postToFamilies.size === (families?.length || 0)
                          ? "All Families"
                          : `${postToFamilies.size} ${postToFamilies.size === 1 ? "Family" : "Families"} Selected`}
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
                      if (postToFamilies.size === (families?.length || 0)) {
                        setPostToFamilies(new Set());
                      } else {
                        setPostToFamilies(
                          new Set(families?.map((f) => f.id) || [])
                        );
                      }
                    }}
                    className="w-full justify-start mb-2 h-8 sm:h-auto"
                  >
                    <div className="flex items-center gap-2">
                      {postToFamilies.size === (families?.length || 0) ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        {postToFamilies.size === (families?.length || 0)
                          ? "Clear All"
                          : "Select All"}
                      </span>
                    </div>
                  </Button>
                  <div className="h-px bg-gray-100 -mx-2 mb-2" />
                  <div className="max-h-[150px] sm:max-h-[200px] overflow-y-auto space-y-1">
                    {families?.map((family) => (
                      <Button
                        key={family.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPostToFamilies((prev) => {
                            const newSet = new Set(prev);
                            if (newSet.has(family.id)) {
                              newSet.delete(family.id);
                            } else {
                              newSet.add(family.id);
                            }
                            return newSet;
                          });
                        }}
                        className="w-full justify-start h-8 sm:h-auto"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {postToFamilies.has(family.id) ? (
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

          {/* Inline Form Error Display */}
          {formError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 bg-red-50 p-3 rounded-md flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1">{formError}</span>
            </motion.p>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Share a moment with your family...
            </label>
            <Textarea
              placeholder="What's on your mind?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[80px] sm:min-h-[100px] bg-gray-50/50 border-0 focus-visible:ring-1 focus-visible:ring-rose-500 resize-none text-sm sm:text-base"
            />
          </div>

          {/* Media Preview */}
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4"
            >
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden group"
                >
                  <img
                    src={previews[index]}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 pt-4 border-t">
            <div className="flex items-center gap-2 w-full sm:w-auto">
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
                className="flex items-center gap-2 w-full sm:w-auto h-9 sm:h-auto"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">Add Media</span>
              </Button>
            </div>
            <Button
              type="submit"
              disabled={isPending || (!text && selectedFiles.length === 0)}
              className="bg-rose-500 hover:bg-rose-600 flex items-center gap-2 w-full sm:w-auto h-9 sm:h-auto"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="text-sm">Post</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed lg:bottom-8 bottom-16 lg:right-8 right-2 bg-rose-500 hover:bg-rose-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// Skeleton Card Component for Posts
function PostSkeletonCard() {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-gray-200 animate-pulse">
      {/* Skeleton Post Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200"></div>
        <div className="flex-1 min-w-0">
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-24 sm:w-32 mb-1 sm:mb-1.5"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-32 sm:w-48"></div>
        </div>
      </div>

      {/* Skeleton Post Text (optional) */}
      <div className="h-3 sm:h-4 bg-gray-200 rounded w-full mb-1 sm:mb-2"></div>
      <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 sm:w-5/6 mb-3 sm:mb-4"></div>

      {/* Skeleton Media Grid */}
      <div className="aspect-square rounded-lg bg-gray-200 mb-3 sm:mb-4"></div>

      {/* Skeleton Post Actions */}
      <div className="flex items-center gap-4 sm:gap-6 pt-3 sm:pt-4 border-t border-gray-100">
        <div className="h-5 sm:h-6 bg-gray-200 rounded w-16 sm:w-20"></div>
        <div className="h-5 sm:h-6 bg-gray-200 rounded w-20 sm:w-24"></div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const queryClient = useQueryClient();
  const [selectedFamilies, setSelectedFamilies] = useState<Set<string>>(
    new Set()
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  const [page, setPage] = useState(1);
  const POSTS_PER_PAGE = 10;

  // Intersection observer for infinite scrolling
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
  });

  // Debounced search handler
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
      setPage(1); // Reset page when search changes
    }, 500),
    []
  );

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  // Fetch user's families
  const { data: families } = useQuery<Family[]>({
    queryKey: ["families"],
    queryFn: async () => {
      const response = await fetch("/api/families");
      const result = await response.json();
      if (!result.success) {
        throw new Error("Something went wrong!");
      }
      return result.data;
    },
  });

  // Check if user has joined any families
  const hasJoinedFamilies = families && families.filter(family => family.userMembershipStatus === "APPROVED").length > 0;

  // Fetch feed with pagination
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
    queryKey: [
      "feed",
      debouncedSearch,
      selectedFamilies.size > 0
        ? Array.from(selectedFamilies)[0]
        : "ALL_FAMILIES",
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        limit: POSTS_PER_PAGE.toString(),
        search: debouncedSearch,
        families:
          selectedFamilies.size === 0 ? "" : Array.from(selectedFamilies)[0],
      });

      const response = await fetch(`/api/feed?${searchParams}`);
      const result = await response.json();
      if (!result.success) {
        throw new Error("Something went wrong!");
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

  // Like post mutation with optimistic updates
  const { mutate: likePost } = useMutation({
    mutationFn: async (postId: string) => {
      setLikingPosts((prev) => new Set(prev).add(postId));
      try {
        const response = await fetch(`/api/posts/${postId}/like`, {
          method: "POST",
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error("Something went wrong!");
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
      await queryClient.cancelQueries({ queryKey: ["feed"] });

      // Snapshot previous value
      const previousFeed = queryClient.getQueryData(["feed"]);

      // Optimistically update feed
      queryClient.setQueryData(
        ["feed", debouncedSearch, selectedFamilies],
        (old: any) => {
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
        }
      );

      // Update photo viewer state if it's open and shows this post
      if (photoViewerState.isOpen && photoViewerState.post?.id === postId) {
        setPhotoViewerState((prev) => ({
          ...prev,
          post: prev.post
            ? {
                ...prev.post,
                isLiked: !prev.post.isLiked,
                _count: {
                  ...prev.post._count,
                  likes: prev.post.isLiked
                    ? prev.post._count.likes - 1
                    : prev.post._count.likes + 1,
                },
              }
            : null,
        }));
      }

      return { previousFeed };
    },
    onError: (error: Error, postId: string, context: any) => {
      // Revert optimistic update on error
      if (context?.previousFeed) {
        queryClient.setQueryData(
          ["feed", debouncedSearch, selectedFamilies],
          context.previousFeed
        );
      }

      // Revert photo viewer state if needed
      if (photoViewerState.isOpen && photoViewerState.post?.id === postId) {
        setPhotoViewerState((prev) => ({
          ...prev,
          post: prev.post
            ? {
                ...prev.post,
                isLiked: !prev.post.isLiked,
                _count: {
                  ...prev.post._count,
                  likes: prev.post.isLiked
                    ? prev.post._count.likes - 1
                    : prev.post._count.likes + 1,
                },
              }
            : null,
        }));
      }

      toast.error("Failed to like post. Please try again.");
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  // Get all posts from all pages
  const allPosts = postsPages?.pages.flat() || [];

  // Corrected handlers for Comment and Likes Modals
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
    setDeleteCommentModalState({
      isOpen: false,
      commentId: null,
      postId: null,
    });
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
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to delete comment" }));
        throw new Error(errorData.message);
      }
      if (response.status === 204) return null;
      return response.json();
    },
    onSuccess: () => {
      if (deleteCommentModalState.postId) {
        queryClient.invalidateQueries({
          queryKey: ["comments", deleteCommentModalState.postId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Comment deleted successfully!");
      handleCloseDeleteCommentModal();
    },
    onError: (error: Error) => {
      toast.error("Failed to delete comment");
      handleCloseDeleteCommentModal();
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
        return { success: true }; // Handle no content response
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Failed to delete post. Please try again.",
        }));
        throw new Error(
          errorData.message || "Failed to delete post. Please try again."
        );
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post deleted successfully!");
      setIsDeletePostModalOpen(false);
      setSelectedPostIdForDeletion(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete post. Please try again.");
      setIsDeletePostModalOpen(false); // Optionally close modal on error or allow retry
      setSelectedPostIdForDeletion(null);
    },
  });

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
          className="hover:text-rose-500 transition-colors flex items-center gap-1 shrink-0"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <span className="text-rose-500 font-medium shrink-0">Family Feed</span>
      </motion.div>

      
      {/* Feed Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-rose-100/50 mb-6 md:mb-8"
      >
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 ${hasJoinedFamilies ? "mb-4 md:mb-6" : "mb-0"}`}>
          <div className="text-center md:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-lora font-bold text-gray-800 mb-2">
              Family Feed 📸
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base">
              Stay updated with moments from all your families
            </p>
          </div>
          <Button
            className="bg-rose-500 hover:bg-rose-600 flex items-center justify-center gap-2 w-full md:w-auto"
            onClick={() => setIsCreatePostOpen(true)}
            disabled={!hasJoinedFamilies}
            title={!hasJoinedFamilies ? "Join a family to create posts" : "Create a new post"}
          >
            <Send className="w-4 h-4" />
            <span className="md:inline">Create Post</span>
          </Button>
        </div>

        {/* Filters and Search */}
        {
          hasJoinedFamilies && (
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="relative w-full md:flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search posts by creator name..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 bg-white w-full h-10 md:h-auto"
            />
          </div>
          <div className="flex justify-center md:justify-start md:flex-shrink-0">
            {/* Family Filter */}
            {
              hasJoinedFamilies && (
                <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 w-full md:w-auto"
                >
                  <Users className="w-4 h-4" />
                  <span className="truncate">
                    {selectedFamilies.size === 0
                      ? "All Families"
                      : families?.find((f) => selectedFamilies.has(f.id))
                          ?.name || "Selected Family"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-60 overflow-y-auto w-56">
                <DropdownMenuRadioGroup
                  value={
                    selectedFamilies.size === 0
                      ? "ALL"
                      : Array.from(selectedFamilies)[0]
                  }
                  onValueChange={(value) => {
                    if (value === "ALL") {
                      setSelectedFamilies(new Set());
                    } else {
                      setSelectedFamilies(new Set([value]));
                    }
                    setPage(1); // Reset page when changing family filter
                    queryClient.invalidateQueries({ queryKey: ["feed"] }); // Force refetch
                  }}
                >
                  <DropdownMenuRadioItem value="ALL">
                    All Families
                  </DropdownMenuRadioItem>
                  {families
                    ?.filter(
                      (family) => family.userMembershipStatus === "APPROVED"
                    )
                    .map((family) => (
                      <DropdownMenuRadioItem key={family.id} value={family.id}>
                        {family.name}
                      </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
              )
            }
          </div>
        </div> 
          )
        }
      </motion.div>

      {/* Posts Section */}
      {isLoading ? (
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {[...Array(3)].map((_, index) => (
            <PostSkeletonCard key={index} />
          ))}
        </div>
      ) : isError ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50/50 backdrop-blur-md rounded-2xl p-6 sm:p-12 text-center border border-red-100/50 text-red-700"
        >
          <div className="bg-red-100 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-lora font-bold text-red-800 mb-2">
            Failed to Load Feed
          </h3>
          <p className="text-red-600 max-w-md mx-auto mb-4 sm:mb-6 text-sm sm:text-base">
            {error instanceof Error
              ? error.message
              : "An unknown error occurred while fetching posts."}
          </p>
          <Button
            onClick={() => refetch()}
            variant="destructive"
            className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
          >
            Retry
          </Button>
        </motion.div>
      ) : !allPosts.length ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 sm:p-12 text-center border border-rose-100/50"
        >
          <div className="bg-rose-50 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-lora font-bold text-gray-800 mb-2">
            No Posts Found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-4 sm:mb-6 text-xs sm:text-base">
            {search || selectedFamilies.size > 0
              ? "Try adjusting your search or filters to see more posts."
              : hasJoinedFamilies 
                ? "Start sharing moments with your family to see posts here."
                : "Join a family to start sharing and seeing posts here."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {!hasJoinedFamilies ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  className="flex items-center justify-center gap-2 w-full sm:w-auto bg-rose-500 hover:bg-rose-600"
                >
                  <Users className="w-4 h-4" />
                  Join or Create a Family
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/families" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Users className="w-4 h-4" />
                    Join More Families
                  </Button>
                </Link>
                <Button
                  className="bg-rose-500 hover:bg-rose-600 flex items-center justify-center gap-2 w-full sm:w-auto"
                  onClick={() => setIsCreatePostOpen(true)}
                  disabled={!hasJoinedFamilies}
                >
                  <ImageIcon className="w-4 h-4" />
                  Create Post
                </Button>
              </>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="max-w-2xl lg:max-w-4xl mx-auto">
          <>
            <div className="space-y-4 sm:space-y-6">
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
                    onEditComment={handleOpenEditCommentModal}
                    onDeleteComment={handleOpenDeleteCommentModal}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Load More Trigger */}
            <div ref={loadMoreRef} className="pt-6 sm:pt-8 flex justify-center">
              {isFetchingNextPage ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 animate-spin" />
              ) : hasNextPage ? (
                <span className="text-gray-500 text-sm">
                  Loading more posts...
                </span>
              ) : (
                <span className="flex items-center gap-2 text-xs sm:text-sm text-rose-600 px-3 sm:px-4 py-2 bg-rose-50 rounded-full border border-rose-200 shadow-sm">
                  <span className="text-lg sm:text-2xl">🫶🏻</span>
                  <span className="hidden sm:inline">
                    No more posts to load
                  </span>
                  <span className="sm:hidden">All caught up!</span>
                </span>
              )}
            </div>
          </>
        </div>
      )}

      {/* Create Post Modal - Replaced with AdvancedCreatePostModal */}
      <AdvancedCreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        families={families?.filter(family => family.userMembershipStatus === "APPROVED")}
      />

      {/* Scroll to Top Button */}
      {allPosts.length > 0 && <ScrollToTopButton />}

      {/* Modals */}
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
        onLikePost={likePost}
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
  onEditComment?: (comment: any, postId: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const { user: currentUser } = useCurrentUser();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const { ref: inViewRef, inView } = useInView({ threshold: 0.5 });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      inViewRef(node);
    },
    [inViewRef]
  );

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (inView) {
        video.play().catch(() => {}); // Catch errors if autoplay is blocked
      } else {
        video.pause();
      }
    });
  }, [inView]);

  const MAX_VISIBLE_CELLS = 4;
  const IMAGES_IN_CELLS_BEFORE_OVERLAY = 3;

  let gridContainerClass = "grid gap-1 mb-4"; // using gap-1 for tighter grid
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
      ref={setRefs}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-rose-100/50"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <img
            src={post.user.imageUrl || "/placeholder-avatar.png"}
            alt={post.user.fullName}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-800 text-sm sm:text-base truncate">
              {post.user.fullName}
            </h3>
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
              <Link
                href={`/families/${post.family.id}`}
                className="hover:text-rose-500 transition-colors truncate"
              >
                {post.family.name}
              </Link>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                {format(new Date(post.createdAt), "MMM d, yyyy")}
              </span>
              <span className="sm:hidden">
                {format(new Date(post.createdAt), "MMM d")}
              </span>
            </div>
          </div>
        </div>
        {currentUser && currentUser.id === post.user.id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 sm:h-auto sm:w-auto shrink-0"
              >
                <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
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
        <p className="text-gray-600 mb-3 sm:mb-4 whitespace-pre-wrap text-sm sm:text-base">
          {post.text}
        </p>
      )}

      {/* Media Grid - Updated Logic */}
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
                  ref={(el) => {
                    if (el) videoRefs.current.set(media.id, el);
                    else videoRefs.current.delete(media.id);
                  }}
                  src={media.url}
                  className="w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  // controls={false} // controls are typically not shown in grid view
                  // poster={media.thumbnailUrl || undefined} // Optional: if you have video thumbnails
                />
              ) : (
                // Consider adding a play icon overlay for videos
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
              className="relative aspect-square rounded-md overflow-hidden group cursor-pointer bg-gray-800" // Added dark bg as fallback
              onClick={() => onOpenPhotoViewer(post, overlayClickIndex)}
            >
              <Image
                src={overlayBackgroundImageUrl}
                alt={`View ${overlayCount} more`}
                fill
                className="object-cover opacity-50 group-hover:opacity-40 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xl sm:text-3xl font-bold">
                  +{overlayCount}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post Actions - Updated for new layout and styling */}
      <div className="flex items-center justify-between pt-4 sm:pt-6 text-gray-500 border-t border-gray-100 mt-4 sm:mt-6">
        {/* Left side: Likes and Comments */}
        <div className="flex items-center gap-3 sm:gap-4">
          <TooltipProvider>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex items-center gap-1 sm:gap-1.5 hover:text-rose-500 transition-colors relative rounded-md px-1.5 sm:px-2 py-1 sm:py-1.5 hover:bg-rose-50/70 group"
                    onClick={handleLike}
                    disabled={isLiking}
                  >
                    <div className="relative">
                      <Heart
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-all group-hover:scale-110 ${post.isLiked ? "fill-rose-500 text-rose-500" : "text-gray-400 group-hover:text-rose-400"} ${isLiking ? "opacity-50 cursor-not-allowed" : ""}`}
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
                    className={`text-xs sm:text-sm font-medium ${post.isLiked ? "text-rose-600" : "text-gray-500 group-hover:text-rose-500"} ${post._count.likes === 0 ? "cursor-default" : "hover:underline"} rounded-md px-1 py-1 sm:py-1.5`}
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
                  className="flex items-center gap-1 sm:gap-1.5 hover:text-blue-500 transition-colors rounded-md px-1.5 sm:px-2 py-1 sm:py-1.5 hover:bg-blue-50/70 group"
                  onClick={() => setShowComments(true)}
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm font-medium text-gray-500 group-hover:text-blue-500">
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
          className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/80 shadow-sm hover:shadow-md transition-all rounded-lg h-8 px-2 sm:h-auto sm:px-3 py-2 text-xs sm:text-sm"
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
