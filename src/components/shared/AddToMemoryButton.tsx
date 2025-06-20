import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AddToMemoryButtonProps {
  itemId: string;
  itemType: "album" | "post";
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  initialIsInMemory?: boolean;
}

export function AddToMemoryButton({
  itemId,
  itemType,
  variant = "outline",
  size = "sm",
  className = "",
  initialIsInMemory = false,
}: AddToMemoryButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [isSuccess, setIsSuccess] = useState(initialIsInMemory);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Use React Query mutation for adding to memories
  const addToMemoriesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/memories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [itemType === "album" ? "albumId" : "postId"]: itemId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error("Failed to add to memories");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setIsSuccess(true);
      setShowSuccessModal(true);

      // Invalidate all memories queries to ensure the UI updates
      if (user && user.id) {
        // Invalidate specific tab queries
        queryClient.invalidateQueries({
          queryKey: ["memories", user.id, "albums"],
        });
        queryClient.invalidateQueries({
          queryKey: ["memories", user.id, "posts"],
        });
        // Also invalidate the general memories query
        queryClient.invalidateQueries({ queryKey: ["memories", user.id] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add to memories",
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    if (addToMemoriesMutation.isPending || isSuccess) return;
    addToMemoriesMutation.mutate();
  };

  const handleBack = () => {
    // Close the modal and navigate to memories tab
    setShowSuccessModal(false);

    // Navigate to the memories tab in the user's profile
    if (user && user.id) {
      router.push(`/profile/${user.id}?tab=memories`);
    } else {
      // Fallback to a general profile page if we don't have the user ID
      router.push("/profile");
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={addToMemoriesMutation.isPending || isSuccess}
      >
        {addToMemoriesMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : isSuccess ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Added to Memories
          </>
        ) : (
          <>
            <BookmarkPlus className="h-4 w-4 mr-2" />
            Add to Memories
          </>
        )}
      </Button>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center mt-7 text-green-600">
              {itemType === "album" ? "Album" : "Post"} Added Successfully 🎉
            </DialogTitle>
          </DialogHeader>
          <div className="pt-6 text-center">
            <div className="mx-auto mb-4 bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-gray-700">
              This {itemType} has been added to your memories.
            </p>
            <p className="text-gray-600 text-sm mt-2 font-medium">
              You can view it anytime in your profile's{" "}
              <span className="text-rose-500 font-bold">Memories</span> section.
            </p>
          </div>
          <DialogFooter className="flex sm:justify-center pt-2"></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
