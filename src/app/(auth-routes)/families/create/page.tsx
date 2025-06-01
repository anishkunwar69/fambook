"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, QueryClient, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  Copy,
  Home,
  Users,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { createFamilySchema, type CreateFamilyInput } from "@/types/family.types";


export default function CreateFamilyPage() {
  const router = useRouter();
  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFamilyInput>({
    resolver: zodResolver(createFamilySchema),
  });

  const { mutate: createFamily, isPending } = useMutation({
    mutationFn: async (data: CreateFamilyInput) => {
      const response = await fetch("/api/families/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!result.success) {
        console.log(result.error);
        throw new Error(result.message);
      }

      return result.data;
    },
    onSuccess: (data) => {
      setJoinToken(data.joinToken);
      toast.success("Family created successfully!");
      queryClient.invalidateQueries({ queryKey: ["families"] });
    },
    onError: (error: Error) => {
      toast.error("Something went wrong!");
    },
  });

  const copyToClipboard = async () => {
    if (joinToken) {
      await navigator.clipboard.writeText(joinToken);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-8">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 mb-8"
      >
        <Link href="/" className="hover:text-rose-500 transition-colors flex items-center gap-1">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/dashboard" className="hover:text-rose-500 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-rose-500 font-medium">Create Family</span>
      </motion.div>

      <div className="max-w-3xl mx-auto flex items-center min-h-[calc(100vh-10rem)]">
        {!joinToken ? (
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
                Create Your Family Space
              </h1>
              <p className="text-gray-600 max-w-md mx-auto">
                Set up a private space for your family to share memories and stay connected
              </p>
            </div>

            <form onSubmit={handleSubmit((data) => createFamily(data))} className="space-y-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Family Name
                </label>
                <Input
                  {...register("name")}
                  placeholder="Enter your family name"
                  className="w-full h-12 bg-white/50 border-gray-200 focus:border-rose-500 focus:ring-rose-500/20"
                />
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-500 text-sm"
                  >
                    {errors.name.message}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                  Description
                  <span className="text-gray-400 text-xs">Optional</span>
                </label>
                <textarea
                  {...register("description")}
                  placeholder="Tell us about your family..."
                  className="w-full min-h-[120px] rounded-lg border border-gray-200 bg-white/50 focus:border-rose-500 focus:ring-rose-500/20 resize-none p-3"
                />
                {errors.description && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-500 text-sm"
                  >
                    {errors.description.message}
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
                    Creating your family space...
                  </div>
                ) : (
                  "Create Family"
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
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-500" />
            </div>

            <h2 className="text-2xl font-lora font-bold text-gray-800 mb-2">
              Family Created Successfully!
            </h2>

            <p className="text-gray-600 mb-6">
              Share this invite code with your family members:
            </p>

            <div className="flex items-center gap-2 justify-center mb-8">
              <code className="bg-gray-100 px-4 py-2 rounded-lg text-lg font-mono">
                {joinToken}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => router.push("/families")}
                className="w-full bg-rose-500 hover:bg-rose-600"
              >
                View All Families
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 