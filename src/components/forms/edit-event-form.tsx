"use client";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { useEffect } from "react";
import { SpecialDay, EventType as PageEventType } from "@/app/(auth-routes)/events/page"; // Assuming types are exported from events page

const eventTypesList: PageEventType[] = [
  "BIRTHDAY",
  "ANNIVERSARY",
  "WEDDING",
  "GRADUATION",
  "HOLIDAY",
  "OTHER",
];

const editEventFormSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z
    .string()
    .optional(),
  venue: z
    .string()
    .max(200, "Venue must be less than 200 characters")
    .optional(),
  type: z.enum(eventTypesList, {
    required_error: "Please select an event type",
  }),
});

type EditEventFormValues = z.infer<typeof editEventFormSchema>;

interface EditEventFormProps {
  eventToEdit: SpecialDay;
  onSuccess?: () => void;
  onCancel: () => void;
}

export function EditEventForm({
  eventToEdit,
  onSuccess,
  onCancel,
}: EditEventFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<EditEventFormValues>({
    resolver: zodResolver(editEventFormSchema),
    defaultValues: {
      title: eventToEdit.title || "",
      description: eventToEdit.description || "",
      // Ensure date is parsed correctly if it's a string
      date: eventToEdit.date ? parseISO(eventToEdit.date) : new Date(),
      time: eventToEdit.time || "",
      venue: eventToEdit.venue || "",
      type: eventToEdit.type,
    },
  });

  useEffect(() => {
    form.reset({
      title: eventToEdit.title || "",
      description: eventToEdit.description || "",
      date: eventToEdit.date ? parseISO(eventToEdit.date) : new Date(),
      time: eventToEdit.time || "",
      venue: eventToEdit.venue || "",
      type: eventToEdit.type,
    });
  }, [eventToEdit, form]);

  const { mutate: updateEvent, isPending } = useMutation({
    mutationFn: async (values: EditEventFormValues) => {
      const payload = {
        ...values,
        date: values.date.toISOString(), // Ensure date is in ISO format for the API
      };
      const response = await fetch(`/api/special-days/${eventToEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update event");
      }
      return result;
    },
    onSuccess: (result) => {
      toast.success(result.message || "Event updated successfully");
      queryClient.invalidateQueries({ queryKey: ["special-days"] }); // Invalidate all special-days queries
      queryClient.invalidateQueries({ queryKey: ["special-days", eventToEdit.id] }); // Invalidate specific event query if you have one
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update event");
    },
  });

  function onSubmit(values: EditEventFormValues) {
    updateEvent(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter event title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter event description"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    field.onChange(e.target.value ? parseISO(e.target.value) : null)
                  }
                  className="bg-white border-gray-300"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="time"
                  placeholder="Select time"
                  {...field}
                  value={field.value || ""}
                  className="bg-white border-gray-300"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter venue or location"
                  {...field}
                  value={field.value || ""}
                  className="bg-white border-gray-300"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {eventTypesList.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" className="bg-rose-500 hover:bg-rose-600" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 