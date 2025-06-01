"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ProfileRedirectPage() {
  const { user: currentUser, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser?.id) {
      // Redirect to the user's profile page
      router.replace(`/profile/${currentUser.id}`);
    }
  }, [currentUser, isLoading, router]);

  // Show loading while we determine where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    </div>
  );
} 