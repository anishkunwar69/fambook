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
    if (workHistory) {
      setCompany(workHistory.company || "");
      setPosition(workHistory.position || "");
      setStartDate(typeof workHistory.startDate === 'string' ? new Date(workHistory.startDate) : workHistory.startDate);
      if (workHistory.endDate) {
        setEndDate(typeof workHistory.endDate === 'string' ? new Date(workHistory.endDate) : workHistory.endDate);
      } else {
        setEndDate(undefined);
      }
      setCurrentlyWorking(workHistory.currentlyWorking || false);
      setLocation(workHistory.location || "");
      setDescription(workHistory.description || "");
    } else {
      resetForm();
    }
  }, [workHistory, isOpen, userId]); // Added userId here just in case it could be initially undefined
  
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {workHistory?.id ? "Edit Work Experience" : "Add Work Experience"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Company */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company*
              </Label>
              <div className="col-span-3">
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company name"
                  required
                />
              </div>
            </div>
            
            {/* Position */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Position*
              </Label>
              <div className="col-span-3">
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Job title"
                  required
                />
              </div>
            </div>
            
            {/* Location */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <div className="col-span-3">
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>
            
            {/* Start Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date*
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="startDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Currently Working */}
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label htmlFor="currentlyWorking">Current Job</Label>
              </div>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="currentlyWorking"
                  checked={currentlyWorking}
                  onCheckedChange={(checked) => setCurrentlyWorking(checked === true)}
                />
                <label
                  htmlFor="currentlyWorking"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I currently work here
                </label>
              </div>
            </div>
            
            {/* End Date (only if not currently working) */}
            {!currentlyWorking && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  End Date*
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="endDate"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => startDate ? date < startDate : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                  placeholder="Job description and responsibilities"
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
                workHistory?.id ? "Update" : "Add"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 