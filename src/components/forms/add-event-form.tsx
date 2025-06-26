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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { Check, ChevronRight, Crown, Users, X } from "lucide-react";
import PremiumUpgradeModal from "@/components/modals/PremiumUpgradeModal";

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
  time: z.string().min(1, "Time is required"),
  venue: z
    .string()
    .min(1, "Venue is required")
    .max(200, "Venue must be less than 200 characters"),
  type: z.enum(eventTypes, {
    required_error: "Please select an event type",
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
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user's families
  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const response = await fetch("/api/families");
        const result = await response.json();
        if (result.success) {
          const approvedFamilies = result.data.filter(
            (family: any) => family.userMembershipStatus === "APPROVED"
          );
          setFamilies(approvedFamilies);
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

  // Clear error when families are selected
  useEffect(() => {
    if (selectedFamilyIds.size > 0) {
      setFormError(null);
    }
  }, [selectedFamilyIds]);

  const { mutate: createEvent, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      if (selectedFamilyIds.size === 0) {
        throw new Error("Please select at least one family");
      }

      // Convert date to ISO string for API
      const payload = {
        ...values,
        date: values.date.toISOString(),
      };

      const results = await Promise.all(
        Array.from(selectedFamilyIds).map(async (familyId) => {
          const response = await fetch("/api/special-days", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...payload, familyId }),
          });

          const result = await response.json();
          if (!response.ok) {
            // Check if this is a limit reached error
            if (result.limitReached) {
              throw new Error("EVENT_LIMIT_REACHED");
            }
            throw new Error(`Failed to create event for family: ${result.message || "Unknown error"}`);
          }

          return result;
        })
      );

      return results;
    },
    onSuccess: (results) => {
      toast.success(`Event created successfully in ${selectedFamilyIds.size} ${selectedFamilyIds.size === 1 ? "family" : "families"}`);
      form.reset();
      setSelectedFamilyIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["special-days"] });
      // Also invalidate the event limit data
      queryClient.invalidateQueries({ queryKey: ["eventLimit"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Error creating event:", error);
      
      // Handle limit reached error
      if (error.message === "EVENT_LIMIT_REACHED") {
        setFormError("Monthly event limit reached. Upgrade to Premium for unlimited events.");
        setShowUpgradeModal(true);
      } else {
      setFormError(error.message);
      toast.error("Failed to create event");
      }
    },
  });

  function onSubmit(values: FormValues) {
    if (selectedFamilyIds.size === 0) {
      setFormError("Please select at least one family");
      return;
    }
    setFormError(null);
    createEvent(values);
  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="sm:space-y-2 space-y-0">
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
            <FormItem className="sm:space-y-2 space-y-0">
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                  min={format(new Date(), "yyyy-MM-dd")}
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
            <FormItem className="sm:space-y-2 space-y-0">
              <FormLabel>Time</FormLabel>
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
            <FormItem className="sm:space-y-2 space-y-0">
              <FormLabel>Venue</FormLabel>
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
            <FormItem className="sm:space-y-2 space-y-0">
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

        {/* Multi-Family Selection */}
        <FormItem className="sm:space-y-2 space-y-0">
          <FormLabel>Families</FormLabel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-10"
                disabled={isPending}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {selectedFamilyIds.size === 0
                      ? "Select families..."
                      : selectedFamilyIds.size === families.length
                        ? "All Families"
                        : `${selectedFamilyIds.size} ${selectedFamilyIds.size === 1 ? "Family" : "Families"} Selected`}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--trigger-width] max-w-[90vw]" side="top">
              <div className="p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedFamilyIds.size === families.length) {
                      setSelectedFamilyIds(new Set());
                    } else {
                      setSelectedFamilyIds(new Set(families.map((f) => f.id)));
                    }
                  }}
                  className="w-full justify-start mb-2 h-8"
                  disabled={isPending}
                >
                  <div className="flex items-center gap-2">
                    {selectedFamilyIds.size === families.length ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                      {selectedFamilyIds.size === families.length
                        ? "Clear All"
                        : "Select All"}
                    </span>
                  </div>
                </Button>
                <div className="h-px bg-gray-100 -mx-2 mb-2" />
                <div className="max-h-[150px] overflow-y-auto space-y-1">
                  {families.map((family) => (
                    <Button
                      key={family.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFamilyIds((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(family.id)) {
                            newSet.delete(family.id);
                          } else {
                            newSet.add(family.id);
                          }
                          return newSet;
                        });
                      }}
                      className="w-full justify-start h-8"
                      disabled={isPending}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {selectedFamilyIds.has(family.id) ? (
                          <div className="w-4 h-4 rounded-sm bg-rose-500 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-sm border border-gray-300 shrink-0" />
                        )}
                        <span className="truncate text-sm">{family.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          {formError && (
              <div className="text-sm text-red-500 mt-2 flex items-start gap-2 bg-red-50 p-3 rounded-md">
                <div className="flex-shrink-0 mt-0.5">
                  {formError.includes("limit") ? (
                    <Crown className="w-4 h-4 text-red-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <p>{formError}</p>
              </div>
          )}
        </FormItem>

        <Button
          type="submit"
          className="w-full bg-rose-500 hover:bg-rose-600"
          disabled={isPending}
        >
          {isPending ? "Creating..." : "Create Event"}
        </Button>
      </form>
    </Form>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureContext="posts"
      />
    </>
  );
}
