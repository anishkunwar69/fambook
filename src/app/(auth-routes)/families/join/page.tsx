"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinFamilySchema, type JoinFamilyInput } from "@/types/family.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight, Home, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

export default function JoinFamilyPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinFamilyInput>({
    resolver: zodResolver(joinFamilySchema),
  });

  const { mutate: joinFamily, isPending } = useMutation({
    mutationFn: async (data: JoinFamilyInput) => {
      const response = await fetch("/api/families/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    onSuccess: (data) => {
      setIsSuccess(true);
      toast.success("Join request submitted successfully!");
    },
    onError: (error: Error) => {
      toast.error("Something went wrong!");
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 sm:mb-8 overflow-x-auto whitespace-nowrap mt-[8px]"
      >
        <Link
          href="/"
          className="hover:text-rose-500 transition-colors flex items-center gap-1 shrink-0"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <Link
          href="/dashboard"
          className="hover:text-rose-500 transition-colors shrink-0"
        >
          <span className="hidden sm:inline">Dashboard</span>
          <span className="sm:hidden">Dash</span>
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <Link
          href="/families"
          className="hover:text-rose-500 transition-colors shrink-0"
        >
          Families
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <span className="text-rose-500 font-medium shrink-0">Join Family</span>
      </motion.div>

      <div className="max-w-2xl lg:max-w-3xl mx-auto flex items-center min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)]">
        {!isSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-lg border border-rose-100/50 w-full"
          >
            <div className="text-center mb-6 sm:mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-rose-50 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4"
              >
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" />
              </motion.div>
              <h1 className="text-xl sm:text-2xl font-lora font-bold text-gray-800 mb-2">
                Join a Family
              </h1>
              <p className="text-gray-600 max-w-md mx-auto text-xs sm:text-base">
                Enter the invite code shared by your family member to join their
                family space
              </p>
            </div>

            <form
              onSubmit={handleSubmit((data) => joinFamily(data))}
              className="space-y-6 sm:space-y-8"
            >
              <div className="sm:space-y-2 space-y-1">
                <label className="sm:text-sm text-xs font-medium text-gray-700">
                  Family Invite Code
                </label>
                <Input
                  {...register("token")}
                  placeholder="Enter the invite code"
                  className="w-full h-11 sm:h-12 bg-white/50 border-gray-200 focus:border-rose-500 focus:ring-rose-500/20 font-mono sm:text-base text-xs"
                />
                {errors.token && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-500 text-sm"
                  >
                    {errors.token.message}
                  </motion.p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 sm:h-12 bg-rose-500 hover:bg-rose-600 transition-all text-base"
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">Joining family...</span>
                    <span className="sm:hidden">Joining...</span>
                  </div>
                ) : (
                  "Join Family"
                )}
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-lg text-center w-full"
          >
            <div className="bg-amber-50 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
            </div>

            <h2 className="text-xl sm:text-2xl font-lora font-bold text-gray-800 mb-3 sm:mb-4">
              Join Request Submitted!
            </h2>

            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4 mb-4 sm:mb-6">
              <p className="text-gray-600 text-sm sm:text-base">
                Your request to join the family has been submitted. Please wait
                for an admin to approve your request. We'll notify you once your
                request has been reviewed.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-rose-500 hover:bg-rose-600 h-11 sm:h-12 text-base"
              >
                Return to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/families")}
                className="w-full h-11 sm:h-12 text-base"
              >
                View My Families
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
