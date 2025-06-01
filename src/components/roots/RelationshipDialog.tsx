"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { AlertCircle, CalendarIcon, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

const relationshipSchema = z.object({
  relationType: z.enum(["PARENT", "SPOUSE"]),
  marriageDate: z.date().optional(),
  divorceDate: z.date().optional(),
  isActive: z.boolean(),
});

type RelationshipDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: z.infer<typeof relationshipSchema>) => Promise<void>;
  initialData?: Partial<z.infer<typeof relationshipSchema>>;
  sourceNode: { id: string; data: { firstName: string; lastName: string } };
  targetNode: { id: string; data: { firstName: string; lastName: string } };
  validateRelationship: (sourceId: string, targetId: string, relationType: string) => string | null;
  isAdmin?: boolean;
};

export function RelationshipDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  sourceNode,
  targetNode,
  validateRelationship,
  isAdmin = true,
}: RelationshipDialogProps) {
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof relationshipSchema>>({
    resolver: zodResolver(relationshipSchema),
    defaultValues: {
      relationType: initialData?.relationType || "PARENT",
      marriageDate: initialData?.marriageDate,
      divorceDate: initialData?.divorceDate,
      isActive: initialData?.isActive ?? true,
    },
  });

  const { isSubmitting } = form.formState;
  const relationType = form.watch("relationType");

  // Validate relationship type whenever it changes
  useEffect(() => {
    if (relationType) {
      const message = validateRelationship(sourceNode.id, targetNode.id, relationType);
      setValidationMessage(message);
    }
  }, [relationType, sourceNode.id, targetNode.id, validateRelationship]);

  const handleSubmit = async (values: z.infer<typeof relationshipSchema>) => {
    // Run validation one final time before submitting
    const validationError = validateRelationship(sourceNode.id, targetNode.id, values.relationType);
    if (validationError) {
      setValidationMessage(validationError);
      return;
    }

    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      console.error("Failed to save relationship:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Define Relationship</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-gray-500 mb-4">
          Defining relationship between{" "}
          <span className="font-medium text-gray-700">
            {sourceNode.data.firstName} {sourceNode.data.lastName}
          </span>{" "}
          and{" "}
          <span className="font-medium text-gray-700">
            {targetNode.data.firstName} {targetNode.data.lastName}
          </span>
        </div>

        {validationMessage && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="p-4 rounded-lg border border-red-100 bg-gradient-to-r from-red-50/80 to-white">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-900">
                    Invalid Relationship
                  </p>
                  <p className="text-sm text-red-600 mt-0.5">
                    {validationMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="relationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PARENT">Parent</SelectItem>
                      <SelectItem value="SPOUSE">Spouse</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {relationType === "SPOUSE" && (
              <>
                <FormField
                  control={form.control}
                  name="marriageDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Marriage Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={e => field.onChange(new Date(e.target.value))}
                          max={format(new Date(), 'yyyy-MM-dd')}
                          className="bg-white border-gray-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!form.watch("isActive") && (
                  <FormField
                    control={form.control}
                    name="divorceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Divorce Date *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={e => field.onChange(new Date(e.target.value))}
                            min={format(form.watch("marriageDate") || new Date("1900-01-01"), 'yyyy-MM-dd')}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            className="bg-white border-gray-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>
                          {field.value ? "Currently Married" : "Divorced"}
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !!validationMessage}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Relationship"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
