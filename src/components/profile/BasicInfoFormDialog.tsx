import React, { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BasicInfoFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  basicInfo: {
    bio?: string | null;
    birthPlace?: string | null;
    currentPlace?: string | null;
    relationshipStatus?: string | null;
    languages?: string[];
  };
  onSuccess: () => void;
}

export function BasicInfoFormDialog({
  isOpen,
  onClose,
  userId,
  basicInfo,
  onSuccess,
}: BasicInfoFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [bio, setBio] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [currentPlace, setCurrentPlace] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [languages, setLanguages] = useState("");
  
  // Initialize form when editing
  useEffect(() => {
    if (basicInfo) {
      setBio(basicInfo.bio || "");
      setBirthPlace(basicInfo.birthPlace || "");
      setCurrentPlace(basicInfo.currentPlace || "");
      setRelationshipStatus(basicInfo.relationshipStatus || "");
      setLanguages(basicInfo.languages ? basicInfo.languages.join(", ") : "");
    }
  }, [basicInfo, isOpen]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Parse languages from comma-separated string to array
    const languagesArray = languages
      .split(",")
      .map(lang => lang.trim())
      .filter(lang => lang !== "");
    
    try {
      const response = await fetch(`/api/users/${userId}/basic-info`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: bio || null,
          birthPlace: birthPlace || null,
          currentPlace: currentPlace || null,
          relationshipStatus: relationshipStatus || null,
          languages: languagesArray.length > 0 ? languagesArray : [],
        }),
      });
      
      const responseData = await response.json();
      
      if (responseData.success) {
        toast({
          title: "Success",
          description: "Basic information updated successfully",
        });
        onSuccess();
      } else {
        throw new Error("Failed to update basic information");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update basic information",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">Edit Basic Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="min-h-[80px] w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          
          <div>
            <Label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Birth Place
            </Label>
            <Input
              id="birthPlace"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              placeholder="City, Country"
              className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          
          <div>
            <Label htmlFor="currentPlace" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Location
            </Label>
            <Input
              id="currentPlace"
              value={currentPlace}
              onChange={(e) => setCurrentPlace(e.target.value)}
              placeholder="City, Country"
              className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          
          <div>
            <Label htmlFor="relationshipStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Relationship Status
            </Label>
            <Select
              value={relationshipStatus}
              onValueChange={setRelationshipStatus}
            >
              <SelectTrigger id="relationshipStatus" className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
                <SelectItem value="Single" className="hover:dark:bg-gray-600">Single</SelectItem>
                <SelectItem value="In a relationship" className="hover:dark:bg-gray-600">In a relationship</SelectItem>
                <SelectItem value="Engaged" className="hover:dark:bg-gray-600">Engaged</SelectItem>
                <SelectItem value="Married" className="hover:dark:bg-gray-600">Married</SelectItem>
                <SelectItem value="Divorced" className="hover:dark:bg-gray-600">Divorced</SelectItem>
                <SelectItem value="Widowed" className="hover:dark:bg-gray-600">Widowed</SelectItem>
                <SelectItem value="It's complicated" className="hover:dark:bg-gray-600">It's complicated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="languages" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Languages
            </Label>
            <Input
              id="languages"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Spanish, French"
              className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Separate multiple languages with commas.
            </p>
          </div>
          
          <DialogFooter className="pt-4">
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
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 