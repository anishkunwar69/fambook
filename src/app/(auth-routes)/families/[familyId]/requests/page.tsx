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

      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
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
        </motion.div>

        {/* Requests List */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
        ) : !requests?.length ? (
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
                className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-rose-100/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={request.user.imageUrl || "/placeholder-avatar.png"}
                      alt={request.user.fullName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium text-gray-800">
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
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() =>
                        handleRequest({
                          memberId: request.id,
                          action: "REJECTED",
                        })
                      }
                      disabled={isUpdating}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-rose-500 hover:bg-rose-600"
                      onClick={() =>
                        handleRequest({
                          memberId: request.id,
                          action: "APPROVED",
                        })
                      }
                      disabled={isUpdating}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 