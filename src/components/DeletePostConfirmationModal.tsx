"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeletePostConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

export function DeletePostConfirmationModal({
  isOpen,
  onClose,
  onConfirmDelete,
  isDeleting,
}: DeletePostConfirmationModalProps) {
  // Prevent closing when deletion is in progress
  const handleOpenChange = (open: boolean) => {
    if (!open && !isDeleting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <AlertTriangle className="size-5 text-yellow-500 mr-3 shrink-0" />
            <span>Delete Post?</span>
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-slate-500">
            Are you sure you want to delete this post? This action cannot be
            undone, and all associated data will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 sm:mt-5 sm:flex-row sm:justify-end sm:space-x-2">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose} disabled={isDeleting} className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Delete Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 