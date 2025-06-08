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
import { Label } from "@/components/ui/label";
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
    if (isOpen) { 
      setInterestsList(interests ? [...interests] : []);
      setNewInterest(""); 
    }
  }, [interests, isOpen]);

  const handleAddInterest = () => {
    const trimmedInterest = newInterest.trim();
    if (trimmedInterest === "") return;
    
    if (interestsList.some((interest) => interest.toLowerCase() === trimmedInterest.toLowerCase())) {
      toast({
        title: "Duplicate interest",
        description: "This interest is already in your list.",
        variant: "destructive",
      });
      return;
    }
    if (interestsList.length >= 20) { 
        toast({
            title: "Limit reached",
            description: "You can add a maximum of 20 interests.",
            variant: "destructive",
        });
        return;
    }
    setInterestsList((prevList) => [...prevList, trimmedInterest]);
    setNewInterest("");
  };

  const handleRemoveInterest = (interestToRemove: string) => { 
    setInterestsList((prevList) => prevList.filter(interest => interest !== interestToRemove));
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
      if (!finalInterestsList.some((interest) => interest.toLowerCase() === trimmedNewInterest.toLowerCase())) {
        if (finalInterestsList.length < 20) {
            finalInterestsList.push(trimmedNewInterest);
        } else {
            toast({
                title: "Limit reached during save",
                description: "Could not add the last typed interest as the maximum is 20.",
                variant: "destructive",
            });
        }
      }
    }
    setNewInterest(""); 
    
    try {
      const response = await fetch(`/api/users/${userId}/interests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: finalInterestsList }),
      });
      
      const responseData = await response.json();
      if (responseData.success) {
        toast({ title: "Success", description: "Interests updated successfully" });
        setInterestsList(finalInterestsList);
        onSuccess();
      } else {
        throw new Error(responseData.message || "Failed to update interests");
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update interests", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">Edit Interests & Hobbies</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="newInterest" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Add an interest or hobby
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="newInterest"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Photography, Hiking"
                className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
              <Button
                type="button"
                onClick={handleAddInterest}
                variant="outline"
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" /> Add
              </Button>
            </div>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Max 20 interests. Press Enter or click Add.
            </p>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Interests
            </Label>
            {interestsList.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-3 rounded-md border bg-gray-50 dark:bg-gray-700/30 dark:border-gray-700 min-h-[80px]">
                {interestsList.map((interest, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-700/30 dark:text-rose-300 dark:hover:bg-rose-700/50 border border-rose-200 dark:border-rose-600/50 shadow-sm"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest)}
                      className="ml-1.5 p-0.5 rounded-full hover:bg-rose-500/20 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      aria-label={`Remove ${interest}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 border rounded-md bg-gray-50 dark:bg-gray-700/30 dark:border-gray-700">
                No interests added yet. Add some to express yourself!
              </div>
            )}
          </div>
          
          <DialogFooter className="pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-rose-500 hover:bg-rose-600 text-white dark:bg-rose-600 dark:hover:bg-rose-700"
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