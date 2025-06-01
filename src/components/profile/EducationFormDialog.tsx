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

// Define the education entry type
export type EducationEntry = {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  startYear: number;
  endYear?: number | null;
  description?: string | null;
};

interface EducationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  education?: EducationEntry | null;
  onSuccess: () => void;
}

// Generate year options
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1950; year--) {
    years.push(year);
  }
  return years;
};

export function EducationFormDialog({
  isOpen,
  onClose,
  userId,
  education,
  onSuccess,
}: EducationFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [startYear, setStartYear] = useState<number | undefined>(undefined);
  const [endYear, setEndYear] = useState<number | null | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [currentlyStudying, setCurrentlyStudying] = useState(false);
  
  // Year options
  const yearOptions = generateYearOptions();
  
  // Initialize form when editing an existing education entry
  useEffect(() => {
    if (education) {
      setInstitution(education.institution || "");
      setDegree(education.degree || "");
      setFieldOfStudy(education.fieldOfStudy || "");
      setStartYear(education.startYear);
      setEndYear(education.endYear);
      setDescription(education.description || "");
      setCurrentlyStudying(!education.endYear);
    } else {
      resetForm();
    }
  }, [education, isOpen]);
  
  const resetForm = () => {
    setInstitution("");
    setDegree("");
    setFieldOfStudy("");
    setStartYear(undefined);
    setEndYear(undefined);
    setDescription("");
    setCurrentlyStudying(false);
  };
  
  const validateForm = () => {
    if (!institution.trim()) {
      toast({
        title: "Missing field",
        description: "Institution name is required",
        variant: "destructive",
      });
      return false;
    }
    
    if (!degree.trim()) {
      toast({
        title: "Missing field",
        description: "Degree is required",
        variant: "destructive",
      });
      return false;
    }
    
    if (!startYear) {
      toast({
        title: "Missing field",
        description: "Start year is required",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const endpoint = education?.id 
        ? `/api/users/${userId}/education/${education.id}`
        : `/api/users/${userId}/education`;
      
      const method = education?.id ? "PATCH" : "POST";
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution,
          degree,
          fieldOfStudy: fieldOfStudy || null,
          startYear,
          endYear: currentlyStudying ? null : endYear,
          description: description || null,
        }),
      });
      
      const responseData = await response.json();
      
      if (responseData.success) {
        toast({
          title: "Success",
          description: education?.id 
            ? "Education entry updated successfully"
            : "Education entry added successfully",
        });
        onSuccess();
        resetForm();
      } else {
        throw new Error(responseData.message || "Operation failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save education entry",
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
          <DialogTitle>
            {education?.id ? "Edit Education" : "Add Education"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Institution */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="institution" className="text-right">
                Institution*
              </Label>
              <div className="col-span-3">
                <Input
                  id="institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="University or school name"
                  required
                />
              </div>
            </div>
            
            {/* Degree */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="degree" className="text-right">
                Degree*
              </Label>
              <div className="col-span-3">
                <Input
                  id="degree"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g., Bachelor of Science"
                  required
                />
              </div>
            </div>
            
            {/* Field of Study */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fieldOfStudy" className="text-right">
                Field of Study
              </Label>
              <div className="col-span-3">
                <Input
                  id="fieldOfStudy"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>
            
            {/* Start Year */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startYear" className="text-right">
                Start Year*
              </Label>
              <div className="col-span-3">
                <Select
                  value={startYear?.toString()}
                  onValueChange={(value) => setStartYear(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Currently Studying */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Current Status</Label>
              <div className="col-span-3">
                <Select
                  value={currentlyStudying ? "current" : "completed"}
                  onValueChange={(value) => setCurrentlyStudying(value === "current")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="current">Currently Studying</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* End Year (only if not currently studying) */}
            {!currentlyStudying && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endYear" className="text-right">
                  End Year
                </Label>
                <div className="col-span-3">
                  <Select
                    value={endYear?.toString() || ""}
                    onValueChange={(value) => setEndYear(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions
                        .filter((year) => !startYear || year >= startYear)
                        .map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {/* Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right align-top pt-2">
                Description
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details about your education"
                  className="resize-none h-20"
                />
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
                education?.id ? "Update" : "Add"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 