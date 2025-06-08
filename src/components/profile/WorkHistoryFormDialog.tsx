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
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the work history entry type
export type WorkHistoryEntry = {
  id?: string;
  company: string;
  position: string;
  startDate: Date | string;
  endDate?: Date | string | null;
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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [currentlyWorking, setCurrentlyWorking] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  
  // Debug: Log when props change or dialog opens/closes
  useEffect(() => {
    console.log("[WorkHistoryDialog] Props update/isOpen change:", { isOpen, userId, workHistory });
    if (isOpen) {
      if (workHistory) {
        setCompany(workHistory.company || "");
        setPosition(workHistory.position || "");
        setStartDate(workHistory.startDate ? new Date(workHistory.startDate) : undefined);
        setEndDate(workHistory.endDate ? new Date(workHistory.endDate) : undefined);
        setCurrentlyWorking(workHistory.currentlyWorking || false);
        setLocation(workHistory.location || "");
        setDescription(workHistory.description || "");
      } else {
        resetForm();
      }
    }
  }, [workHistory, isOpen, userId]);
  
  const resetForm = () => {
    console.log("[WorkHistoryDialog] Resetting form");
    setCompany("");
    setPosition("");
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentlyWorking(false);
    setLocation("");
    setDescription("");
  };
  
  const validateForm = () => {
    console.log("[WorkHistoryDialog] Validating form with state:", { company, position, startDate, endDate, currentlyWorking });
    if (!company.trim()) {
      console.log("[WorkHistoryDialog] Validation failed: Company name missing");
      toast({
        title: "Missing field",
        description: "Company name is required",
        variant: "destructive",
      });
      return false;
    }
    
    if (!position.trim()) {
      console.log("[WorkHistoryDialog] Validation failed: Position missing");
      toast({
        title: "Missing field",
        description: "Position is required",
        variant: "destructive",
      });
      return false;
    }
    
    if (!startDate) {
      console.log("[WorkHistoryDialog] Validation failed: Start date missing");
      toast({
        title: "Missing field",
        description: "Start date is required",
        variant: "destructive",
      });
      return false;
    }
    
    if (!currentlyWorking && !endDate) {
      console.log("[WorkHistoryDialog] Validation failed: End date or currently working missing");
      toast({
        title: "Missing field",
        description: "Please provide an end date or mark as currently working",
        variant: "destructive",
      });
      return false;
    }
    
    if (endDate && startDate && endDate < startDate) {
      console.log("[WorkHistoryDialog] Validation failed: End date cannot be before start date");
      toast({
        title: "Invalid dates",
        description: "End date cannot be before start date",
        variant: "destructive",
      });
      return false;
    }
    
    console.log("[WorkHistoryDialog] Validation successful");
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[WorkHistoryDialog] handleSubmit called. isSubmitting:", isSubmitting);
    console.log("[WorkHistoryDialog] Current form state before validation:", { company, position, startDate, endDate, currentlyWorking, location, description, userId });

    if (!validateForm()) {
      console.log("[WorkHistoryDialog] handleSubmit returning due to validation failure.");
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
        startDate: startDate?.toISOString(),
        endDate: currentlyWorking ? null : endDate?.toISOString(),
        currentlyWorking,
        location: location || null,
        description: description || null,
      };
      console.log("[WorkHistoryDialog] Sending request to", method, endpoint, "with payload:", payload);

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
        throw new Error(responseData.message || "Operation failed");
      }
    } catch (error) {
      console.error("[WorkHistoryDialog] Error in handleSubmit:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save work history entry",
        variant: "destructive",
      });
    } finally {
      console.log("[WorkHistoryDialog] Setting isSubmitting to false.");
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {workHistory?.id ? "Edit Work Experience" : "Add Work Experience"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company*</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Google"
              className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          
          <div>
            <Label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position*</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g., Software Engineer"
              className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div>
            <Label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</Label>
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
              <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 hover:dark:bg-gray-600",
                      !startDate && "text-muted-foreground dark:text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 dark:bg-gray-800 border-gray-200 dark:border-gray-700" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="dark:bg-gray-800 dark:text-gray-100"
                    classNames={{
                        day_selected: "dark:bg-rose-500 dark:text-white dark:hover:bg-rose-600",
                        day_today: "dark:text-rose-400",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date {currentlyWorking ? "" : "*"}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    disabled={currentlyWorking}
                    className={cn(
                      "w-full justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 hover:dark:bg-gray-600",
                      !endDate && "text-muted-foreground dark:text-gray-400",
                      currentlyWorking && "dark:bg-gray-600 dark:text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate && !currentlyWorking ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 dark:bg-gray-800 border-gray-200 dark:border-gray-700" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={currentlyWorking}
                    initialFocus
                    className="dark:bg-gray-800 dark:text-gray-100"
                     classNames={{
                        day_selected: "dark:bg-rose-500 dark:text-white dark:hover:bg-rose-600",
                        day_today: "dark:text-rose-400",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox 
              id="currentlyWorking"
              checked={currentlyWorking}
              onCheckedChange={(checked) => {
                setCurrentlyWorking(Boolean(checked));
                if (Boolean(checked)) {
                  setEndDate(undefined);
                }
              }}
              className="dark:border-gray-600 data-[state=checked]:dark:bg-rose-500 data-[state=checked]:dark:text-gray-100"
            />
            <Label htmlFor="currentlyWorking" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Currently working here
            </Label>
          </div>
          
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional: Describe your responsibilities and achievements"
              className="min-h-[80px] w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          
          <DialogFooter className="pt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white dark:bg-rose-600 dark:hover:bg-rose-700" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : (workHistory?.id ? "Save Changes" : "Add Experience")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 