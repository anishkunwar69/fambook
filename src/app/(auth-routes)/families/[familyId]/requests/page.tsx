"use client";

import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  Home,
  Loader2,
  Shield,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

type JoinRequest = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    imageUrl?: string;
    createdAt: string;
  };
};

// Header Skeleton Component
function HeaderSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-rose-100/50 mb-6 md:mb-8">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-full text-center md:text-left">
          <div className="h-7 md:h-9 bg-gray-200 rounded animate-pulse w-48 max-w-[80%] mx-auto md:mx-0 mb-2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-64 max-w-[90%] mx-auto md:mx-0" />
        </div>
        <div className="hidden md:block bg-gray-200 w-12 h-12 rounded-lg animate-pulse shrink-0" />
      </div>
    </div>
  );
}

// Request Card Skeleton Component
function RequestCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 md:p-6 border border-rose-100/50">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div className="relative shrink-0">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="absolute -top-1 -right-1 bg-gray-200 w-4 h-4 rounded-full animate-pulse" />
          </div>
          <div className="w-full text-center sm:text-left">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 max-w-[80%] mx-auto sm:mx-0 mb-2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-48 max-w-[90%] mx-auto sm:mx-0 mb-2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-40 max-w-[70%] mx-auto sm:mx-0" />
          </div>
        </div>
        
        <div className="flex justify-center sm:justify-end gap-2 pt-4 border-t border-gray-200 md:border-0 md:pt-0 shrink-0 w-full md:w-auto">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-20" />
          <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
        </div>
      </div>
    </div>
  );
}

// Full Page Skeleton Component
function JoinRequestsPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 md:p-8 max-lg:pb-20">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-6 sm:mb-8 mt-[14px] overflow-hidden">
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
          <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse shrink-0" />
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse shrink-0" />
        <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse shrink-0" />
        <div className="w-14 h-4 bg-gray-200 rounded animate-pulse shrink-0" />
        <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse shrink-0" />
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse shrink-0" />
      </div>

      {/* Header Skeleton */}
      <HeaderSkeleton />

      {/* Request Cards Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <RequestCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export default function JoinRequestsPage() {
  const { familyId } = useParams();
  const queryClient = useQueryClient();
  const [fetchRequestsError, setFetchRequestsError] = useState<boolean>(false);

  // Fetch pending requests
  const {
    data: requests,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["join-requests", familyId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/families/${familyId}/requests`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        return result.data as JoinRequest[];
      } catch (err: any) {
        setFetchRequestsError(true);
        throw new Error(err?.message || "Unexpected error occurred");
      }
    },
  });

  // Handle request actions (approve/reject)
  const { mutate: handleRequest, isPending: isUpdating } = useMutation({
    mutationFn: async ({
      memberId,
      action,
    }: {
      memberId: string;
      action: "APPROVED" | "REJECTED";
    }) => {
      const response = await fetch(`/api/families/${familyId}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, action }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to process request");
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Request ${
          variables.action === "APPROVED" ? "approved" : "rejected"
        } successfully`
      );
      queryClient.invalidateQueries({ queryKey: ["join-requests", familyId] });
      queryClient.invalidateQueries({ queryKey: ["families"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to process request");
    },
  });

  // Show skeleton while loading
  if (isLoading) {
    return <JoinRequestsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 md:p-8 max-lg:pb-20">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-8 overflow-x-auto whitespace-nowrap mt-[14px]"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          href="/families"
          className="hover:text-rose-500 transition-colors"
        >
          Families
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          href={`/families/${familyId}`}
          className="hover:text-rose-500 transition-colors"
        >
          Family
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-rose-500 font-medium">Join Requests</span>
      </motion.div>

      {/* Header - Updated to match feed/families page style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-rose-100/50 mb-8"
      >
        <div className="flex flex-col items-center text-center gap-4 md:flex-row md:text-left md:items-center md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-lora font-bold text-gray-800 mb-2">
              Join Requests <span className="text-2xl sm:text-3xl">🤝</span>
            </h1>
            <p className="text-gray-600 text-xs sm:text-base">
              Review and manage join requests for your family
            </p>
          </div>
          <div className="bg-rose-50 w-12 h-12 rounded-lg flex items-center justify-center shrink-0 mx-auto md:mx-0 hidden md:flex">
            <Shield className="w-6 h-6 text-rose-500" />
          </div>
        </div>
      </motion.div>

      {/* Requests List */}

      {fetchRequestsError ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50/50 backdrop-blur-md rounded-2xl p-6 sm:p-12 text-center border border-red-100/50 text-red-700"
        >
          <div className="bg-red-100 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-lora font-bold text-red-800 mb-2">
            Failed to Load Families
          </h3>
          <p className="text-red-600 max-w-md mx-auto mb-4 sm:mb-6 text-xs sm:text-base">
            An unknown error occurred.
          </p>
          <Button
            onClick={() => refetch()}
            variant="destructive"
            className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
          >
            Retry
          </Button>
        </motion.div>
      ) : !requests?.length ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-12 text-center border border-rose-100/50"
        >
          <div className="bg-rose-50 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-lora font-bold text-gray-800 mb-2">
            No Pending Requests
          </h3>
          <p className="text-gray-600 max-w-md mx-auto text-xs sm:text-base">
            There are currently no pending join requests for your family.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-md rounded-xl p-4 md:p-6 border border-rose-100/50 hover:border-rose-200/70 transition-all duration-300 group"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="relative shrink-0">
                    <img
                      src={request.user.imageUrl || "/placeholder-avatar.png"}
                      alt={request.user.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-rose-100 transition-colors"
                    />
                    <div className="absolute -top-1 -right-1 bg-amber-500 w-4 h-4 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 group-hover:text-rose-600 transition-colors">
                      {request.user.fullName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {request.user.email}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        Requested{" "}
                        {format(
                          new Date(request.joinedAt),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center sm:justify-end gap-2 w-full md:w-auto pt-4 border-t border-rose-100/50 md:pt-0 md:border-0 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 transition-all"
                    onClick={() =>
                      handleRequest({
                        memberId: request.id,
                        action: "REJECTED",
                      })
                    }
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-1" />
                    )}
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-rose-500 hover:bg-rose-600 transition-all"
                    onClick={() =>
                      handleRequest({
                        memberId: request.id,
                        action: "APPROVED",
                      })
                    }
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
