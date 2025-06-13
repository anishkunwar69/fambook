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
import { Checkbox } from "@/components/ui/checkbox";
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
  const [currentlyStudying, setCurrentlyStudying] = useState(false);
  
  // Error states
  const [errors, setErrors] = useState({
    institution: false,
    degree: false,
    startYear: false,
    endYear: false
  });
  
  // Year options
  const yearOptions = generateYearOptions();
  
  // Initialize form when editing an existing education entry
  useEffect(() => {
    if (isOpen) {
      if (education) {
        setInstitution(education.institution || "");
        setDegree(education.degree || "");
        setFieldOfStudy(education.fieldOfStudy || "");
        setStartYear(education.startYear);
        setEndYear(education.endYear);
        setCurrentlyStudying(!education.endYear && education.endYear !== 0);
      } else {
        resetForm();
      }
      // Reset errors when opening dialog
      setErrors({
        institution: false,
        degree: false,
        startYear: false,
        endYear: false
      });
    }
  }, [education, isOpen]);
  
  const resetForm = () => {
    setInstitution("");
    setDegree("");
    setFieldOfStudy("");
    setStartYear(undefined);
    setEndYear(undefined);
    setCurrentlyStudying(false);
  };
  
  const validateForm = () => {
    const newErrors = {
      institution: !institution.trim(),
      degree: !degree.trim(),
      startYear: !startYear,
      endYear: !currentlyStudying && !endYear
    };
    
    setErrors(newErrors);
    
    if (newErrors.institution || newErrors.degree || newErrors.startYear || newErrors.endYear) {
      return false;
    }
    
    if (endYear && startYear && endYear < startYear) {
      toast({
        title: "Invalid dates",
        description: "End year cannot be before start year",
        variant: "destructive",
      });
      setErrors({...newErrors, endYear: true});
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
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {education?.id ? "Edit Education" : "Add Education"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="institution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Institution*</Label>
            <Input
              id="institution"
              value={institution}
              onChange={(e) => {
                setInstitution(e.target.value);
                if (e.target.value.trim()) setErrors({...errors, institution: false});
              }}
              placeholder="e.g., Harvard University"
              className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.institution ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.institution && (
              <p className="mt-1 text-sm text-red-500">Required</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="degree" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Degree*</Label>
            <Input
              id="degree"
              value={degree}
              onChange={(e) => {
                setDegree(e.target.value);
                if (e.target.value.trim()) setErrors({...errors, degree: false});
              }}
              placeholder="e.g., Bachelor of Science"
              className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.degree ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.degree && (
              <p className="mt-1 text-sm text-red-500">Required</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field of Study</Label>
            <Input
              id="fieldOfStudy"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              placeholder="e.g., Computer Science"
              className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Year*</Label>
              <Select
                value={startYear?.toString()}
                onValueChange={(value) => {
                  setStartYear(parseInt(value));
                  setErrors({...errors, startYear: false});
                }}
              >
                <SelectTrigger 
                  id="startYear" 
                  className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.startYear ? 'border-red-500 focus:ring-red-500' : ''}`}
                >
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="hover:dark:bg-gray-600">{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.startYear && (
                <p className="mt-1 text-sm text-red-500">Required</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="endYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Year {currentlyStudying ? "" : "*"}
              </Label>
              <Select
                value={currentlyStudying ? "" : endYear?.toString() || ""} 
                onValueChange={(value) => {
                  setEndYear(value ? parseInt(value) : null);
                  setErrors({...errors, endYear: false});
                }}
                disabled={currentlyStudying}
              >
                <SelectTrigger 
                  id="endYear" 
                  className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.endYear ? 'border-red-500 focus:ring-red-500' : ''}`}
                >
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="hover:dark:bg-gray-600">{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.endYear && !currentlyStudying && (
                <p className="mt-1 text-sm text-red-500">Required</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox 
              id="currentlyStudying"
              checked={currentlyStudying}
              onCheckedChange={(checked) => {
                const isChecked = Boolean(checked);
                setCurrentlyStudying(isChecked);
                if (isChecked) {
                  setEndYear(null);
                  setErrors({...errors, endYear: false});
                }
              }}
              className="dark:border-gray-600 data-[state=checked]:dark:bg-rose-500 data-[state=checked]:dark:text-gray-100"
            />
            <Label htmlFor="currentlyStudying" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Currently studying here
            </Label>
          </div>
          
          <DialogFooter className="">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white dark:bg-rose-600 dark:hover:bg-rose-700" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : (education?.id ? "Save Changes" : "Add Education")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 