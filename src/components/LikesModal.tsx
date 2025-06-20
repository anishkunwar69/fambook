"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Users } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

const LIKERS_PER_PAGE = 20;

// User type (represents a liker)
interface UserType {
  id: string;
  fullName: string;
  imageUrl: string | null;
}

// Skeleton item for the likes list
function LikeSkeletonItem() {
  return (
    <div className="flex items-center gap-4 px-6 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-200"></div>
      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
    </div>
  );
}

interface LikesModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  initialLikeCount?: number; // For displaying total in title
}

export default function LikesModal({
  postId,
  isOpen,
  onClose,
  initialLikeCount = 0,
}: LikesModalProps) {
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
    threshold: 0.5,
  });

  const {
    data: likerPages,
    fetchNextPage,
    hasNextPage,
    isLoading: isLoadingLikers,
    isFetchingNextPage,
    isError: isLikersError,
    error: likersError,
    refetch: refetchLikers,
  } = useInfiniteQuery<{
    likers: UserType[];
    nextPage?: number;
    totalLikes: number;
  }>({
    queryKey: ["likers", postId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `/api/posts/${postId}/likes?page=${pageParam}&limit=${LIKERS_PER_PAGE}`
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error("Failed to fetch likers");
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

  const allLikers = likerPages?.pages.flatMap((page) => page.likers) || [];
  const actualTotalLikes = likerPages?.pages[0]?.totalLikes ?? initialLikeCount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-50 p-0 shadow-2xl rounded-xl flex flex-col h-[400px]">
        <DialogHeader className="border-b border-slate-200 p-5 shrink-0">
          <DialogTitle className="font-lora text-2xl text-rose-500">
            Liked By ({actualTotalLikes})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto styled-scrollbar py-2">
          {isLoadingLikers && !allLikers.length ? (
            <>
              {[...Array(5)].map((_, i) => (
                <LikeSkeletonItem key={i} />
              ))}
            </>
          ) : isLikersError ? (
            <div className="flex-grow flex flex-col items-center justify-center py-8 px-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-slate-700 font-semibold text-md mb-1">
                Couldn't load likes
              </p>
              <p className="text-sm text-slate-500 mb-5 max-w-xs">
                {likersError instanceof Error
                  ? likersError.message
                  : "An unexpected error occurred."}
              </p>
              <Button
                onClick={() => refetchLikers()}
                variant="outline"
                className="border-slate-300 hover:bg-slate-100 text-slate-700"
              >
                Try Again
              </Button>
            </div>
          ) : !allLikers.length && !isFetchingNextPage ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center py-12 px-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-rose-500" />
              </div>
              <p className="text-slate-700 font-semibold text-md mb-1">
                No likes yet
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {allLikers.map((liker, index) => (
                <motion.div
                  key={liker.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="px-6 py-3 hover:bg-slate-100/80 transition-colors duration-100 flex items-center gap-4"
                >
                  <img
                    src={liker.imageUrl || "/placeholder-avatar.png"}
                    alt={liker.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-slate-800">
                      {liker.fullName}
                    </h4>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingNextPage ? (
                <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
              ) : (
                <span className="text-sm text-slate-500">
                  Scroll to load more
                </span>
              )}
            </div>
          )}
          {!isLoadingLikers &&
            !isFetchingNextPage &&
            !hasNextPage &&
            allLikers.length > 0 &&
            actualTotalLikes > LIKERS_PER_PAGE && (
              <p className="text-center text-sm text-rose-500 pt-4">
                No more likes
              </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
