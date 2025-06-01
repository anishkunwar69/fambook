import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface InterestsFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  interests: string[];
  onSuccess: () => void;
}

export function InterestsFormDialog({
  isOpen,
  onClose,
  userId,
  interests,
  onSuccess,
}: InterestsFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interestsList, setInterestsList] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    if (interests) {
      setInterestsList([...interests]);
    } else {
      setInterestsList([]);
    }
  }, [interests, isOpen]);

  const handleAddInterest = () => {
    if (newInterest.trim() === "") return;
    
    // Check if the interest already exists (case insensitive)
    if (
      interestsList.some(
        (interest) => interest.toLowerCase() === newInterest.trim().toLowerCase()
      )
    ) {
      toast({
        title: "Duplicate interest",
        description: "This interest is already in your list",
        variant: "destructive",
      });
      return;
    }
    
    setInterestsList((prevList) => [...prevList, newInterest.trim()]);
    setNewInterest("");
  };

  const handleRemoveInterest = (index: number) => {
    const updatedInterests = [...interestsList];
    updatedInterests.splice(index, 1);
    setInterestsList(updatedInterests);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddInterest();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalInterestsList = [...interestsList];
    const trimmedNewInterest = newInterest.trim();

    if (trimmedNewInterest !== "") {
      if (
        !finalInterestsList.some(
          (interest) => interest.toLowerCase() === trimmedNewInterest.toLowerCase()
        )
      ) {
        finalInterestsList.push(trimmedNewInterest);
        // Clear the input field as we are now considering this interest for submission
        setNewInterest(""); 
      } else if (interestsList.length === finalInterestsList.length) {
        // If it's a duplicate of an item already in the *badges* (interestsList)
        // and not just a duplicate of what was in the input field before this submit handler ran,
        // we can clear the input field. Otherwise, user might be surprised it clears.
        // This handles the case where user types a duplicate and hits save.
        setNewInterest("");
      }
    }
    
    try {
      const response = await fetch(`/api/users/${userId}/interests`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interests: finalInterestsList, // Send the potentially updated list
        }),
      });
      
      const responseData = await response.json();
      
      if (responseData.success) {
        toast({
          title: "Success",
          description: "Interests updated successfully",
        });
        // Update the local list to reflect the saved state, including the potentially added newInterest
        setInterestsList(finalInterestsList);
        onSuccess();
      } else {
        throw new Error(responseData.message || "Failed to update interests");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update interests",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Interests</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add an interest (e.g., Photography, Hiking, Cooking)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddInterest}
                  variant="outline"
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {interestsList.length > 0 ? (
                  interestsList.map((interest, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(index)}
                        className="ml-1 hover:text-destructive focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No interests added yet. Add some interests to show on your profile.
                  </p>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Tip: Type an interest and press Enter or click the + button to add it to your list.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-rose-500 hover:bg-rose-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Interests"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 