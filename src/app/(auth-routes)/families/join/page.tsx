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
        <Link
          href="/dashboard"
          className="hover:text-rose-500 transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          href="/families"
          className="hover:text-rose-500 transition-colors"
        >
          Families
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-rose-500 font-medium">Join Family</span>
      </motion.div>

      <div className="max-w-3xl mx-auto flex items-center min-h-[calc(100vh-10rem)]">
        {!isSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-rose-100/50 w-full"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-rose-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Users className="w-8 h-8 text-rose-500" />
              </motion.div>
              <h1 className="text-2xl font-lora font-bold text-gray-800 mb-2">
                Join a Family
              </h1>
              <p className="text-gray-600 max-w-md mx-auto">
                Enter the invite code shared by your family member to join their
                family space
              </p>
            </div>

            <form
              onSubmit={handleSubmit((data) => joinFamily(data))}
              className="space-y-8"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Family Invite Code
                </label>
                <Input
                  {...register("token")}
                  placeholder="Enter the invite code"
                  className="w-full h-12 bg-white/50 border-gray-200 focus:border-rose-500 focus:ring-rose-500/20 font-mono"
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
                className="w-full h-12 bg-rose-500 hover:bg-rose-600 transition-all"
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Joining family...
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
            className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg text-center w-full"
          >
            <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-amber-500" />
            </div>

            <h2 className="text-2xl font-lora font-bold text-gray-800 mb-4">
              Join Request Submitted!
            </h2>

            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4 mb-6">
              <p className="text-gray-600">
                Your request to join the family has been submitted. Please wait
                for an admin to approve your request. We'll notify you once your
                request has been reviewed.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-rose-500 hover:bg-rose-600"
              >
                Return to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/families")}
                className="w-full"
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
