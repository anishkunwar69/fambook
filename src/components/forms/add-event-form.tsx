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
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const eventTypes = [
  "BIRTHDAY",
  "ANNIVERSARY",
  "WEDDING",
  "GRADUATION",
  "HOLIDAY",
  "OTHER",
] as const;

const formSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
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
  type: z.enum(eventTypes, {
    required_error: "Please select an event type",
  }),
  familyId: z.string({
    required_error: "Please select a family",
  }),
});

type FormValues = z.infer<typeof formSchema>;

type Family = {
  id: string;
  name: string;
};

interface AddEventFormProps {
  onSuccess?: () => void;
  defaultDate?: Date;
}

export function AddEventForm({ onSuccess, defaultDate }: AddEventFormProps) {
  const [families, setFamilies] = useState<Family[]>([]);
  const queryClient = useQueryClient();

  // Fetch user's families
  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const response = await fetch("/api/families");
        const result = await response.json();
        if (result.success) {
          setFamilies(result.data);
        }
      } catch (error) {
        console.error("Error fetching families:", error);
        toast.error("Failed to load families");
      }
    };

    fetchFamilies();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: defaultDate || new Date(),
      time: "",
      venue: "",
    },
  });

  const { mutate: createEvent, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert date to ISO string for API
      const payload = {
        ...values,
        date: values.date.toISOString(),
      };

      const response = await fetch("/api/special-days", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to create event");
      }

      return result;
    },
    onSuccess: (result) => {
      toast.success(result.message || "Event created successfully");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["special-days"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Error creating event:", error);
      toast.error(error.message || "Failed to create event");
    },
  });

  function onSubmit(values: FormValues) {
    createEvent(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                  onChange={e => field.onChange(new Date(e.target.value))}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="bg-white border-gray-200"
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
                  className="bg-white border-gray-200"
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
                  className="bg-white border-gray-200"
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
                  {eventTypes.map((type) => (
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

        <FormField
          control={form.control}
          name="familyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Family</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select family" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {families.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-rose-500 hover:bg-rose-600"
          disabled={isPending}
        >
          {isPending ? "Creating..." : "Create Event"}
        </Button>
      </form>
    </Form>
  );
} 