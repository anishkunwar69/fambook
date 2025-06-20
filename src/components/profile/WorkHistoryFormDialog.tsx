import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

// Define the work history entry type
export type WorkHistoryEntry = {
  id?: string;
  company: string;
  position: string;
  startYear: number;
  endYear?: number | null;
  currentlyWorking?: boolean;
  location?: string | null;
  description?: string | null;
};

interface WorkHistoryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  workHistory?: WorkHistoryEntry | null;
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

export function WorkHistoryFormDialog({
  isOpen,
  onClose,
  userId,
  workHistory,
  onSuccess,
}: WorkHistoryFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [startYear, setStartYear] = useState<number | undefined>(undefined);
  const [endYear, setEndYear] = useState<number | null | undefined>(undefined);
  const [currentlyWorking, setCurrentlyWorking] = useState(false);
  const [location, setLocation] = useState("");

  // Error states
  const [errors, setErrors] = useState({
    company: false,
    position: false,
    startYear: false,
    endYear: false,
  });

  // Year options
  const yearOptions = generateYearOptions();

  // Debug: Log when props change or dialog opens/closes
  useEffect(() => {
    console.log("[WorkHistoryDialog] Props update/isOpen change:", {
      isOpen,
      userId,
      workHistory,
    });
    if (isOpen) {
      if (workHistory) {
        setCompany(workHistory.company || "");
        setPosition(workHistory.position || "");
        setStartYear(workHistory.startYear);
        setEndYear(workHistory.endYear);
        setCurrentlyWorking(workHistory.currentlyWorking || false);
        setLocation(workHistory.location || "");
      } else {
        resetForm();
      }
      // Reset errors when opening dialog
      setErrors({
        company: false,
        position: false,
        startYear: false,
        endYear: false,
      });
    }
  }, [workHistory, isOpen, userId]);

  const resetForm = () => {
    console.log("[WorkHistoryDialog] Resetting form");
    setCompany("");
    setPosition("");
    setStartYear(undefined);
    setEndYear(undefined);
    setCurrentlyWorking(false);
    setLocation("");
  };

  const validateForm = () => {
    console.log("[WorkHistoryDialog] Validating form with state:", {
      company,
      position,
      startYear,
      endYear,
      currentlyWorking,
    });

    const newErrors = {
      company: !company.trim(),
      position: !position.trim(),
      startYear: !startYear,
      endYear: !currentlyWorking && !endYear,
    };

    setErrors(newErrors);

    if (
      newErrors.company ||
      newErrors.position ||
      newErrors.startYear ||
      newErrors.endYear
    ) {
      return false;
    }

    if (endYear && startYear && endYear < startYear) {
      toast({
        title: "Invalid dates",
        description: "End year cannot be before start year",
        variant: "destructive",
      });
      setErrors({ ...newErrors, endYear: true });
      return false;
    }

    console.log("[WorkHistoryDialog] Validation successful");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(
      "[WorkHistoryDialog] handleSubmit called. isSubmitting:",
      isSubmitting
    );
    console.log("[WorkHistoryDialog] Current form state before validation:", {
      company,
      position,
      startYear,
      endYear,
      currentlyWorking,
      location,
      userId,
    });

    if (!validateForm()) {
      console.log(
        "[WorkHistoryDialog] handleSubmit returning due to validation failure."
      );
      return;
    }

    console.log("[WorkHistoryDialog] Setting isSubmitting to true.");
    setIsSubmitting(true);

    try {
      const endpoint = workHistory?.id
        ? `/api/users/${userId}/work-history/${workHistory.id}`
        : `/api/users/${userId}/work-history`;

      const method = workHistory?.id ? "PATCH" : "POST";

      const payload = {
        company,
        position,
        startYear,
        endYear: currentlyWorking ? null : endYear,
        currentlyWorking,
        location: location || null,
      };
      console.log(
        "[WorkHistoryDialog] Sending request to",
        method,
        endpoint,
        "with payload:",
        payload
      );

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log("[WorkHistoryDialog] Received response:", responseData);

      if (responseData.success) {
        toast({
          title: "Success",
          description: workHistory?.id
            ? "Work history entry updated successfully"
            : "Work history entry added successfully",
        });
        onSuccess();
        resetForm();
      } else {
        throw new Error("Operation failed");
      }
    } catch (error) {
      console.error("[WorkHistoryDialog] Error in handleSubmit:", error);
      toast({
        title: "Error",
        description: "Failed to save work history entry",
        variant: "destructive",
      });
    } finally {
      console.log("[WorkHistoryDialog] Setting isSubmitting to false.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {workHistory?.id ? "Edit Work Experience" : "Add Work Experience"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Company*
            </Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                if (e.target.value.trim())
                  setErrors({ ...errors, company: false });
              }}
              placeholder="e.g., Google"
              className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.company ? "border-red-500 focus:ring-red-500" : ""}`}
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-500">Required</p>
            )}
          </div>

          <div>
            <Label
              htmlFor="position"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Position*
            </Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => {
                setPosition(e.target.value);
                if (e.target.value.trim())
                  setErrors({ ...errors, position: false });
              }}
              placeholder="e.g., Software Engineer"
              className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.position ? "border-red-500 focus:ring-red-500" : ""}`}
            />
            {errors.position && (
              <p className="mt-1 text-sm text-red-500">Required</p>
            )}
          </div>

          <div>
            <Label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Mountain View, CA"
              className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="startYear"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Start Year*
              </Label>
              <Select
                value={startYear?.toString()}
                onValueChange={(value) => {
                  setStartYear(parseInt(value));
                  setErrors({ ...errors, startYear: false });
                }}
              >
                <SelectTrigger
                  id="startYear"
                  className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.startYear ? "border-red-500 focus:ring-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
                  {yearOptions.map((year) => (
                    <SelectItem
                      key={year}
                      value={year.toString()}
                      className="hover:dark:bg-gray-600"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.startYear && (
                <p className="mt-1 text-sm text-red-500">Required</p>
              )}
            </div>

            <div>
              <Label
                htmlFor="endYear"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                End Year {currentlyWorking ? "" : "*"}
              </Label>
              <Select
                value={currentlyWorking ? "" : endYear?.toString() || ""}
                onValueChange={(value) => {
                  setEndYear(value ? parseInt(value) : null);
                  setErrors({ ...errors, endYear: false });
                }}
                disabled={currentlyWorking}
              >
                <SelectTrigger
                  id="endYear"
                  className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${errors.endYear ? "border-red-500 focus:ring-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
                  {yearOptions.map((year) => (
                    <SelectItem
                      key={year}
                      value={year.toString()}
                      className="hover:dark:bg-gray-600"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.endYear && !currentlyWorking && (
                <p className="mt-1 text-sm text-red-500">Required</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="currentlyWorking"
              checked={currentlyWorking}
              onCheckedChange={(checked) => {
                const isChecked = Boolean(checked);
                setCurrentlyWorking(isChecked);
                if (isChecked) {
                  setEndYear(null);
                  setErrors({ ...errors, endYear: false });
                }
              }}
              className="dark:border-gray-600 data-[state=checked]:dark:bg-rose-500 data-[state=checked]:dark:text-gray-100"
            />
            <Label
              htmlFor="currentlyWorking"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Currently working here
            </Label>
          </div>

          <DialogFooter className="">
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : workHistory?.id ? (
                "Save Changes"
              ) : (
                "Add Experience"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
