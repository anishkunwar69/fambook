import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

// Schema for validating FamilyRoot creation
const createRootSchema = z.object({
  name: z
    .string()
    .min(3, "Tree name must be at least 3 characters")
    .max(100, "Tree name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  familyId: z.string().min(1, "Family selection is required"),
});

type CreateRootFormData = z.infer<typeof createRootSchema>;

interface CreateRootModalProps {
  isOpen: boolean;
  onClose: () => void;
  families: { id: string; name: string }[];
}

const CreateRootModal: React.FC<CreateRootModalProps> = ({
  isOpen,
  onClose,
  families,
}) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<CreateRootFormData>({
    resolver: zodResolver(createRootSchema),
    defaultValues: {
      name: "",
      description: "",
      familyId: families.length > 0 ? families[0].id : "",
    },
  });

  useEffect(() => {
    if (families.length > 0) {
      reset({ familyId: families[0].id, name: "", description: "" });
    }
  }, [families, reset]);

  const createRootMutation = useMutation<
    any, // Adjust response type as needed
    Error,
    CreateRootFormData
  >({
    mutationFn: async (data) => {
      const response = await fetch("/api/roots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || "Failed to create family tree");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Family tree created successfully!");
      queryClient.invalidateQueries({ queryKey: ["allFamilyRoots"] });
      queryClient.invalidateQueries({ queryKey: ["familyRoots"] }); // If you have a specific family roots query
      onClose();
      reset();
    },
    onError: (error) => {
      toast.error(error.message || "An error occurred.");
    },
  });

  const onSubmit = (data: CreateRootFormData) => {
    createRootMutation.mutate(data);
  };

  // Use mutation's pending state
  const isPending = createRootMutation.isPending;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-800">
            Create New Family Tree
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-1">
            Select a family and provide a name for your new family tree.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="familyId" className="font-medium text-gray-700">
              Family
            </Label>
            <Controller
              name="familyId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger id="familyId" className="w-full">
                    <SelectValue placeholder="Select a family" />
                  </SelectTrigger>
                  <SelectContent>
                    {families.map((family) => (
                      <SelectItem key={family.id} value={family.id}>
                        {family.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.familyId && (
              <p className="text-sm text-red-500 mt-1">
                {errors.familyId.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name" className="font-medium text-gray-700">
              Tree Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., The Miller Family Legacy"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="font-medium text-gray-700">
              Description (Optional)
            </Label>
            <Input
              id="description"
              placeholder="A brief description of this family tree."
              {...register("description")}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Tree"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRootModal;
