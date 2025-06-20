import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

// Validation schema
const lifeEventSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  eventDate: z.date({
    required_error: "Please select a date",
  }),
  eventType: z.string().min(1, "Please select an event type"),
  location: z
    .string()
    .max(200, "Location must be less than 200 characters")
    .optional(),
});

type FormValues = z.infer<typeof lifeEventSchema>;

// Type definitions
type LifeEvent = {
  id: string;
  title: string;
  eventDate: string;
  location?: string | null;
  eventType: string;
};

// Define event types and labels
const EVENT_TYPES = [
  { value: "birth", label: "Birth" },
  { value: "marriage", label: "Marriage" },
  { value: "job", label: "New Job" },
  { value: "move", label: "Moved" },
  { value: "graduation", label: "Graduation" },
  { value: "award", label: "Award" },
  { value: "other", label: "Other" },
];

interface AddLifeEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  event?: LifeEvent | null;
  onSuccess: () => void;
}

export function AddLifeEventDialog({
  isOpen,
  onClose,
  userId,
  event,
  onSuccess,
}: AddLifeEventDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(lifeEventSchema),
    defaultValues: {
      title: "",
      eventDate: undefined,
      eventType: "",
      location: "",
    },
  });

  // Initialize form when editing an existing event
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        eventDate: new Date(event.eventDate),
        eventType: event.eventType,
        location: event.location || "",
      });
    } else {
      form.reset({
        title: "",
        eventDate: undefined,
        eventType: "",
        location: "",
      });
    }
  }, [event, isOpen, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      const endpoint = event?.id
        ? `/api/life-events/${event.id}`
        : "/api/life-events";

      const method = event?.id ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          eventDate: values.eventDate.toISOString(),
          location: values.location || null,
          eventType: values.eventType,
        }),
      });

      const responseData = await response.json();

      if (responseData.success) {
        // Reset form first
        form.reset();
        // Show success toast
        toast.success(
          event?.id
            ? "Life event updated successfully!"
            : "Life event added successfully!"
        );
        // Call the success callback
        onSuccess();
      } else {
        throw new Error("Operation failed");
      }
    } catch (error) {
      console.error("Error saving life event:", error);
      toast.error(
        "An error occurred while saving your life event"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium font-lora text-rose-500">
            {event?.id ? "Edit Life Event" : "Add Life Event"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type*</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Birth of James" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date*</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="date"
                        className="w-full pr-10"
                        {...field}
                        value={
                          field.value ? format(field.value, "yyyy-MM-dd") : ""
                        }
                        onChange={(e) => {
                          const date = e.target.value
                            ? new Date(e.target.value)
                            : undefined;
                          field.onChange(date);
                        }}
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., San Francisco, CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
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
                disabled={isSubmitting}
                className="bg-rose-500 hover:bg-rose-600"
              >
                {isSubmitting
                  ? "Saving..."
                  : event?.id
                    ? "Save Changes"
                    : "Add Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
