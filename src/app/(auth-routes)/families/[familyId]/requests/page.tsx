"use client";

import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Home,
  Users,
  Loader2,
  Check,
  X,
  Clock,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-rose-100/50 mb-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-80" />
        </div>
        <div className="bg-gray-200 w-12 h-12 rounded-lg animate-pulse" />
      </div>
    </motion.div>
  );
}

// Request Card Skeleton Component
function RequestCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-rose-100/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="absolute -top-1 -right-1 bg-gray-200 w-4 h-4 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-48 mb-2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-40" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
          <div className="h-8 bg-gray-200 rounded animate-pulse w-20" />
        </div>
      </div>
    </motion.div>
  );
}

// Full Page Skeleton Component
function JoinRequestsPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-8">
      {/* Breadcrumb Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-8"
      >
        <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
      </motion.div>

      {/* Header Skeleton */}
      <HeaderSkeleton />

      {/* Request Cards Skeleton */}
      <div className="space-y-4">
        {[...Array(8)].map((_, index) => (
          <RequestCardSkeleton key={index} index={index} />
        ))}
      </div>
    </div>
  );
}

export default function JoinRequestsPage() {
  const { familyId } = useParams();
  const queryClient = useQueryClient();

  // Fetch pending requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["join-requests", familyId],
    queryFn: async () => {
      const response = await fetch(`/api/families/${familyId}/requests`);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data as JoinRequest[];
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
      toast.error(error.message || "Failed to process request");
    },
  });

  // Show skeleton while loading
  if (isLoading) {
    return <JoinRequestsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-8">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-8"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/families" className="hover:text-rose-500 transition-colors">
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
        className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-rose-100/50 mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-lora font-bold text-gray-800 mb-2">
              Join Requests
            </h1>
            <p className="text-gray-600">
              Review and manage pending join requests for your family
            </p>
          </div>
          <div className="bg-rose-50 w-12 h-12 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-rose-500" />
          </div>
        </div>
      </motion.div>

      {/* Requests List */}
      {!requests?.length ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-12 text-center border border-rose-100/50"
        >
          <div className="bg-rose-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-xl font-lora font-bold text-gray-800 mb-2">
            No Pending Requests
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
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
              className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-rose-100/50 hover:border-rose-200/70 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
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
                    <p className="text-sm text-gray-500">{request.user.email}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
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

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 opacity-0 group-hover:opacity-100 transition-all"
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
                    className="bg-rose-500 hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition-all"
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