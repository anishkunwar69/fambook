"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  Copy,
  Crown,
  Home,
  Loader2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { createFamilySchema, type CreateFamilyInput } from "@/types/family.types";
import PremiumUpgradeModal from "@/components/modals/PremiumUpgradeModal";

// Define the family type
interface FamilyWithStatus {
  id: string;
  name: string;
  description?: string;
  joinToken: string;
  userMembershipStatus: "APPROVED" | "PENDING" | "REJECTED" | null;
}

export default function CreateFamilyPage() {
  const router = useRouter();
  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Check if user already has a family
  const { data: families, isLoading: loadingFamilies } = useQuery<FamilyWithStatus[]>({
    queryKey: ["families"],
    queryFn: async () => {
      const response = await fetch("/api/families");
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data || [];
    },
  });

  // Show premium modal if user already has a family
  useEffect(() => {
    if (!loadingFamilies && families) {
      const approvedFamilies = families.filter(
        (family: FamilyWithStatus) => family.userMembershipStatus === "APPROVED"
      );
      if (approvedFamilies.length >= 1) {
        setShowPremiumModal(true);
      }
    }
  }, [families, loadingFamilies]);

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

  // Show loading state while checking family count
  if (loadingFamilies) {
    return (
      <div className="min-h-[90vh] lg:min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          <p className="text-gray-600">Checking your account...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PremiumUpgradeModal 
        isOpen={showPremiumModal} 
        onClose={() => router.back()}
        featureContext="families"
        showCloseButton={false}
        customActionLabel="Go Back"
      />

    <div className="min-h-[90vh] lg:min-h-screen bg-gradient-to-b from-amber-50 via-rose-50/30 to-white p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto whitespace-nowrap md:mb-6 sm:mb-4 mt-[8px]"
      >
        <Link href="/" className="hover:text-rose-500 transition-colors flex items-center gap-1 shrink-0">
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <Link href="/dashboard" className="hover:text-rose-500 transition-colors shrink-0">
          <span className="hidden sm:inline">Dashboard</span>
          <span className="sm:hidden">Dash</span>
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <span className="text-rose-500 font-medium shrink-0">Create Family</span>
      </motion.div>

      <div className="max-w-2xl lg:max-w-3xl mx-auto flex items-center min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)]">
        {!joinToken ? (
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
                Create Your Family Space
              </h1>
              <p className="text-gray-600 max-w-md mx-auto text-xs sm:text-base">
                Set up a private space for your family to share memories and stay connected
              </p>
            </div>

            <form onSubmit={handleSubmit((data) => createFamily(data))} className="space-y-4 sm:space-y-8">
              <div className="sm:space-y-2 space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Family Name
                </label>
                <Input
                  {...register("name")}
                  placeholder="Enter your family name"
                  className="w-full h-11 sm:h-12 bg-white/50 border-gray-200 focus:border-rose-500 focus:ring-rose-500/20 sm:text-base text-xs"
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

              <div className="sm:space-y-2 space-y-1">
                <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                  Description
                  <span className="text-gray-400 text-xs">Optional</span>
                </label>
                <textarea
                  {...register("description")}
                  placeholder="Tell us about your family..."
                  className="w-full min-h-[100px] sm:min-h-[120px] rounded-lg border border-gray-200 bg-white/50 focus:border-rose-500 focus:ring-rose-500/20 resize-none p-3 sm:text-base text-xs"
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
                className="w-full h-11 sm:h-12 bg-rose-500 hover:bg-rose-600 transition-all text-base"
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">Creating your family space...</span>
                    <span className="sm:hidden">Creating...</span>
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
            className="bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-lg text-center w-full"
          >
            <div className="bg-green-50 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>

            <h2 className="text-xl sm:text-2xl font-lora font-bold text-gray-800 mb-2">
              Family Created Successfully!
            </h2>

            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Share this invite code with your family members:
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center mb-6 sm:mb-8">
              <code className="bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-base sm:text-lg font-mono break-all text-center">
                {joinToken}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0 h-10 w-16 sm:h-auto sm:w-auto"
              >
                {copied ? (
                  <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 text-sm hidden sm:inline">Copied!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                  <Copy className="w-4 h-4" />
                    <span className="text-sm hidden sm:inline">Copy</span>
                  </div>
                )}
              </Button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <Button
                onClick={() => router.push(`/families`)}
                className="w-full bg-rose-500 hover:bg-rose-600 h-11 sm:h-12 text-base"
              >
                View My Families
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full h-11 sm:h-12 text-base"
              >
                Return to Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
} 