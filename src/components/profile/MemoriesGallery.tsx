import { PhotoViewerModal } from "@/components/PhotoViewerModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Album, AlertTriangle, Image, Loader2, Trash2 } from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useInView } from "react-intersection-observer";

// Post type for memories (simplified)
type MemoryPost = {
  id: string;
  text: string | null;
  media: {
    id: string;
    url: string;
    type: "PHOTO" | "VIDEO";
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

// PhotoViewerModal compatible Post type
type PhotoViewerPost = {
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

// Helper function to convert MemoryPost to PhotoViewerModal compatible format
const convertToPhotoViewerPost = (post: MemoryPost): PhotoViewerPost => ({
  ...post,
  media: post.media.map((media) => ({ ...media, caption: null })),
});

interface MemoryType {
  id: string;
  userId: string;
  albumId?: string | null;
  postId?: string | null;
  createdAt: string;
  album?: {
    id: string;
    name: string;
    description?: string | null;
    coverImage?: string | null;
    mediaCount: number;
    createdAt: string;
    media: Array<{
      id: string;
      url: string;
      type: string;
    }>;
  } | null;
  post?: MemoryPost | null;
}

interface MemoriesGalleryProps {
  userId: string;
  isCurrentUser: boolean;
}

export function MemoriesGallery({
  userId,
  isCurrentUser,
}: MemoriesGalleryProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<string>("albums");
  const [isActuallyCurrentUser, setIsActuallyCurrentUser] =
    useState(isCurrentUser);

  // Constants for pagination
  const MEMORIES_PER_PAGE = 10;

  // Intersection observer for infinite scrolling
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
  });

  // States for post interactions (matching feed page)
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const [commentModalState, setCommentModalState] = useState<{
    isOpen: boolean;
    postId: string | null;
  }>({ isOpen: false, postId: null });
  const [likesModalState, setLikesModalState] = useState<{
    isOpen: boolean;
    postId: string | null;
  }>({ isOpen: false, postId: null });
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [selectedPostForEditing, setSelectedPostForEditing] =
    useState<MemoryPost | null>(null);
  const [photoViewerState, setPhotoViewerState] = useState<{
    isOpen: boolean;
    post: MemoryPost | null;
    initialMediaIndex: number;
  }>({ isOpen: false, post: null, initialMediaIndex: 0 });
  const [isDeletePostModalOpen, setIsDeletePostModalOpen] = useState(false);
  const [selectedPostIdForDeletion, setSelectedPostIdForDeletion] = useState<
    string | null
  >(null);

  // State for Delete Memory Confirmation Modal
  const [isDeleteMemoryConfirmModalOpen, setIsDeleteMemoryConfirmModalOpen] =
    useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<{
    id: string;
    name: string;
    type: "album" | "post";
  } | null>(null);

  // Debug log for props
  console.log("MemoriesGallery props:", { userId, isCurrentUser });

  // Fetch memories with infinite scrolling
  const {
    data: memoriesPages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["memories", userId, activeTab],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const searchParams = new URLSearchParams({
          type: activeTab,
          page: pageParam.toString(),
          limit: MEMORIES_PER_PAGE.toString(),
        });

        const response = await fetch(
          `/api/users/${userId}/memories?${searchParams}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch memories");
        }
        const responseData = await response.json();
        console.log("Memories API response:", responseData);

        // Update the user ownership based on API response
        if (responseData.isSelf !== undefined) {
          setIsActuallyCurrentUser(responseData.isSelf);

          // Log if there's a discrepancy
          if (responseData.isSelf !== isCurrentUser) {
            console.warn("API isSelf value differs from prop:", {
              apiIsSelf: responseData.isSelf,
              propIsCurrentUser: isCurrentUser,
            });
          }
        }

        return responseData.data;
      } catch (error) {
        console.error("Error fetching memories:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === MEMORIES_PER_PAGE
        ? allPages.length + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  // Load more memories when scrolling to the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Reset query when tab changes
  useEffect(() => {
    queryClient.resetQueries({ queryKey: ["memories", userId, activeTab] });
  }, [activeTab, queryClient, userId]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (memoryId: string) => {
      const response = await fetch(`/api/memories/${memoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete memory");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Memory removed successfully");
      queryClient.invalidateQueries({
        queryKey: ["memories", userId, activeTab],
      });
      // Close dialog on success
      setIsDeleteMemoryConfirmModalOpen(false);
      setMemoryToDelete(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to remove memory");
      // Close dialog on error as well
      setIsDeleteMemoryConfirmModalOpen(false);
      setMemoryToDelete(null);
    },
  });

  // Like post mutation (matching feed page)
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
      await queryClient.cancelQueries({
        queryKey: ["memories", userId, activeTab],
      });

      // Snapshot previous value
      const previousMemories = queryClient.getQueryData([
        "memories",
        userId,
        activeTab,
      ]);

      // Optimistically update memories
      queryClient.setQueryData(["memories", userId, activeTab], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any[]) =>
            page.map((memory: any) =>
              memory.post?.id === postId
                ? {
                    ...memory,
                    post: {
                      ...memory.post,
                      isLiked: !memory.post.isLiked,
                      _count: {
                        ...memory.post._count,
                        likes: memory.post.isLiked
                          ? memory.post._count.likes - 1
                          : memory.post._count.likes + 1,
                      },
                    },
                  }
                : memory
            )
          ),
        };
      });

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

      return { previousMemories };
    },
    onError: (error: Error, postId: string, context: any) => {
      // Revert optimistic update on error
      if (context?.previousMemories) {
        queryClient.setQueryData(
          ["memories", userId, activeTab],
          context.previousMemories
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
      queryClient.invalidateQueries({
        queryKey: ["memories", userId, activeTab],
      });
    },
  });

  // Delete post mutation
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
      queryClient.invalidateQueries({
        queryKey: ["memories", userId, activeTab],
      });
      toast.success("Post deleted successfully!");
      setIsDeletePostModalOpen(false);
      setSelectedPostIdForDeletion(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete post. Please try again.");
      setIsDeletePostModalOpen(false);
      setSelectedPostIdForDeletion(null);
    },
  });

  // Post interaction handlers (matching feed page)
  const handleOpenCommentModal = (postId: string) => {
    setCommentModalState({ isOpen: true, postId });
  };

  const handleOpenLikesModal = (postId: string) => {
    setLikesModalState({ isOpen: true, postId });
  };

  const openPhotoViewer = (post: MemoryPost, initialMediaIndex: number) => {
    setPhotoViewerState({ isOpen: true, post, initialMediaIndex });
  };

  const closePhotoViewer = () => {
    setPhotoViewerState({ isOpen: false, post: null, initialMediaIndex: 0 });
  };

  const handleOpenEditModal = (post: MemoryPost) => {
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

  const handleNavigateToAlbums = () => {
    router.push("/albums");
  };

  const handleNavigateToPosts = () => {
    router.push("/feed");
  };

  const handleDeleteMemory = (memory: MemoryType) => {
    const memoryName =
      memory.album?.name || memory.post?.text?.slice(0, 50) || "this memory";
    const memoryType = memory.album ? "album" : "post";

    setMemoryToDelete({
      id: memory.id,
      name: memoryName,
      type: memoryType,
    });
    setIsDeleteMemoryConfirmModalOpen(true);
  };

  const handleCloseDeleteMemoryModal = () => {
    // Prevent closing dialog when mutation is pending
    if (!deleteMutation.isPending) {
      setIsDeleteMemoryConfirmModalOpen(false);
      setMemoryToDelete(null);
    }
  };

  const handleConfirmDeleteMemory = () => {
    if (memoryToDelete) {
      deleteMutation.mutate(memoryToDelete.id);
      // Dialog will be closed in mutation onSuccess/onError callbacks
    }
  };

  const memories = memoriesPages?.pages?.flatMap((page) => page) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold mb-6 font-lora text-rose-500 hidden sm:block">
          Memories & Photos
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="albums" className="mt-6">
            <MemoriesSkeletonLoader activeTab="albums" />
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            <MemoriesSkeletonLoader activeTab="posts" />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold mb-6 font-lora text-rose-500 hidden sm:block">
          Memories & Photos
        </h1>
        <div className="text-center p-12">
          <p className="text-gray-500 mb-4">
            {error instanceof Error
              ? error.message
              : "Failed to load memories. Please try again later."}
          </p>
          <Button
            onClick={() => refetch()}
            className="bg-rose-500 hover:bg-rose-600"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-6 font-lora text-rose-500 hidden sm:block">
        Memories & Photos
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="albums" className="mt-6">
          {memories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
                {memories.map((memory: MemoryType) => (
                  <Card
                    key={memory.id}
                    className="overflow-hidden group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all rounded-lg"
                  >
                    {memory.album && (
                      <div className="relative">
                        {isActuallyCurrentUser && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 z-10"
                            onClick={() => handleDeleteMemory(memory)}
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </Button>
                        )}
                        <Link
                          href={`/albums/${memory.album?.id}`}
                          className="block"
                        >
                          <div
                            className="aspect-[4/3] bg-cover bg-center relative"
                            style={{
                              backgroundImage: memory.album.coverImage
                                ? `url(${memory.album.coverImage})`
                                : "none",
                            }}
                          >
                            {!memory.album.coverImage && (
                              <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                <Album className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                            {/* Gradient overlay for text visibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-70 group-hover:opacity-80 transition-opacity"></div>

                            {/* Content positioned above gradient */}
                            <div className="absolute bottom-3 left-3 right-3 z-10">
                              <h3 className="font-semibold text-lg text-white truncate group-hover:text-rose-100 transition-colors">
                                {memory.album.name}
                              </h3>
                              <p className="text-sm text-gray-200 group-hover:text-rose-200 transition-colors">
                                {memory.album.mediaCount}{" "}
                                {memory.album.mediaCount === 1
                                  ? "item"
                                  : "items"}{" "}
                                •{" "}
                                {format(
                                  new Date(memory.album.createdAt),
                                  "MMM d, yyyy"
                                )}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {/* Load More Trigger for Albums */}
              <div ref={loadMoreRef} className="pt-8 flex justify-center">
                {isFetchingNextPage ? (
                  <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                ) : hasNextPage ? (
                  <span className="text-gray-500">Loading more albums...</span>
                ) : memories.length > 0 ? (
                  <span className="flex items-center gap-2 text-sm text-rose-600 px-4 py-2 bg-rose-50 rounded-full border border-rose-200 shadow-sm mt-2">
                    <span className="text-2xl">📸</span>
                    No more albums to load
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
              <Album className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-5">No album memories yet.</p>
              {isActuallyCurrentUser && (
                <Button
                  onClick={handleNavigateToAlbums}
                  className="bg-rose-500 hover:bg-rose-600"
                >
                  Browse Albums
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="mt-6">
          {memories.length > 0 ? (
            <>
              <div className="max-w-4xl mx-auto space-y-6">
                <AnimatePresence mode="popLayout">
                  {memories.map(
                    (memory: MemoryType) =>
                      memory.post && (
                        <MemoryPostCard
                          key={memory.id}
                          memory={memory}
                          post={memory.post}
                          onOpenPhotoViewer={openPhotoViewer}
                          onRemoveFromMemory={() => handleDeleteMemory(memory)}
                          isCurrentUser={isActuallyCurrentUser}
                        />
                      )
                  )}
                </AnimatePresence>
              </div>

              {/* Load More Trigger for Posts */}
              <div ref={loadMoreRef} className="pt-8 flex justify-center">
                {isFetchingNextPage ? (
                  <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                ) : hasNextPage ? (
                  <span className="text-gray-500">Loading more posts...</span>
                ) : memories.length > 0 ? (
                  <span className="flex items-center gap-2 text-sm text-rose-600 px-4 py-2 bg-rose-50 rounded-full border border-rose-200 shadow-sm mt-2">
                    <span className="text-2xl">🫶🏻</span>
                    No more posts to load
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
              <Image className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-5">No post memories yet.</p>
              {isActuallyCurrentUser && (
                <Button
                  onClick={handleNavigateToPosts}
                  className="bg-rose-500 hover:bg-rose-600"
                >
                  Browse Posts
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        isOpen={photoViewerState.isOpen}
        post={
          photoViewerState.post
            ? convertToPhotoViewerPost(photoViewerState.post)
            : null
        }
        initialMediaIndex={photoViewerState.initialMediaIndex}
        onClose={closePhotoViewer}
        onLikePost={likePost}
        isLikingStatus={
          photoViewerState.post
            ? likingPosts.has(photoViewerState.post.id)
            : false
        }
        onOpenLikesModal={handleOpenLikesModal}
      />

      {/* Delete Memory Confirmation Modal */}
      {memoryToDelete && (
        <Dialog
          open={isDeleteMemoryConfirmModalOpen}
          onOpenChange={(open) => {
            // Prevent closing dialog when mutation is pending
            if (!deleteMutation.isPending) {
              setIsDeleteMemoryConfirmModalOpen(open);
              if (!open) {
                setMemoryToDelete(null);
              }
            }
          }}
        >
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Confirm Memory Removal
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to remove "{" "}
                <strong>
                  {memoryToDelete.name.length > 50
                    ? `${memoryToDelete.name}...`
                    : memoryToDelete.name}
                </strong>
                " from your memories?
                <br />
                <br />
                This action cannot be undone.{" "}
                {memoryToDelete.type === "album"
                  ? "The original album"
                  : "The original post"}{" "}
                will <span className="font-semibold">not</span> be deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={handleCloseDeleteMemoryModal}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDeleteMemory}
                disabled={deleteMutation.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove from Memories"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Simplified PostCard component for memories
function MemoryPostCard({
  memory,
  post,
  onOpenPhotoViewer,
  onRemoveFromMemory,
  isCurrentUser,
}: {
  memory: MemoryType;
  post: MemoryPost;
  onOpenPhotoViewer: (post: MemoryPost, initialMediaIndex: number) => void;
  onRemoveFromMemory: () => void;
  isCurrentUser: boolean;
}) {
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-rose-100/50 relative"
    >
      {/* Remove from Memory Button */}
      {isCurrentUser && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
          onClick={onRemoveFromMemory}
          title="Remove from memories"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      {/* Post Header */}
      <div className="flex items-center gap-4 mb-4">
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
                <video src={media.url} className="w-full h-full object-cover" />
              ) : (
                <NextImage
                  src={media.url}
                  alt="Post image"
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
              <NextImage
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
    </motion.div>
  );
}

// Skeleton components for loading states
function AlbumSkeletonCard() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <CardContent className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </CardContent>
    </Card>
  );
}

function PostSkeletonCard() {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-rose-100/50 animate-pulse">
      {/* Post Header Skeleton */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-48"></div>
        </div>
      </div>

      {/* Post Text Skeleton */}
      <div className="mb-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>

      {/* Media Grid Skeleton */}
      <div className="grid grid-cols-2 gap-1">
        <div className="aspect-square rounded-md bg-gray-200"></div>
        <div className="aspect-square rounded-md bg-gray-200"></div>
      </div>
    </div>
  );
}

function MemoriesSkeletonLoader({ activeTab }: { activeTab: string }) {
  if (activeTab === "albums") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <AlbumSkeletonCard key={index} />
        ))}
      </div>
    );
  } else {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {[...Array(3)].map((_, index) => (
          <PostSkeletonCard key={index} />
        ))}
      </div>
    );
  }
}

export default MemoriesGallery;
