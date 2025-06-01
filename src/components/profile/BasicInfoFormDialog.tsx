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
        throw new Error(responseData.message || "Failed to update basic information");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update basic information",
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
          <DialogTitle>Edit Basic Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Bio */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bio" className="text-right align-top pt-2">
                Bio
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  className="resize-none h-20"
                />
              </div>
            </div>
            
            {/* Birth Place */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="birthPlace" className="text-right">
                Birth Place
              </Label>
              <div className="col-span-3">
                <Input
                  id="birthPlace"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>
            
            {/* Current Place */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentPlace" className="text-right">
                Current Location
              </Label>
              <div className="col-span-3">
                <Input
                  id="currentPlace"
                  value={currentPlace}
                  onChange={(e) => setCurrentPlace(e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>
            
            {/* Relationship Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="relationshipStatus" className="text-right">
                Relationship Status
              </Label>
              <div className="col-span-3">
                <Select
                  value={relationshipStatus}
                  onValueChange={setRelationshipStatus}
                >
                  <SelectTrigger id="relationshipStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="In a relationship">In a relationship</SelectItem>
                    <SelectItem value="Engaged">Engaged</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                    <SelectItem value="It's complicated">It's complicated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Languages */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="languages" className="text-right">
                Languages
              </Label>
              <div className="col-span-3">
                <Input
                  id="languages"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="English, Spanish, French (comma separated)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate multiple languages with commas
                </p>
              </div>
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
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 