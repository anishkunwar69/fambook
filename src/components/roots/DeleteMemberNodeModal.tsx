import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type MemberToDelete = {
  id: string;
  firstName: string;
  lastName: string;
};

interface DeleteMemberNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToDelete: MemberToDelete | null;
  onConfirmDelete: (nodeId: string) => void;
  isDeleting: boolean;
}

export function DeleteMemberNodeModal({
  isOpen,
  onClose,
  memberToDelete,
  onConfirmDelete,
  isDeleting,
}: DeleteMemberNodeModalProps) {
  const [confirmationName, setConfirmationName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setConfirmationName("");
    }
  }, [isOpen, memberToDelete]);

  const fullName = memberToDelete
    ? `${memberToDelete.firstName} ${memberToDelete.lastName}`
    : "";
  
  const isMatch = memberToDelete
    ? confirmationName === fullName
    : false;

  if (!memberToDelete) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-red-100/50">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2 sm:text-lg text-base">
            <AlertTriangle className="sm:w-5 sm:h-5 w-4 h-4" />
            Delete Family Member
          </DialogTitle>
          <DialogDescription className="pt-2 max-sm:text-xs">
            Are you absolutely sure you want to delete the family member "
            <strong className="text-gray-800">{fullName}</strong>"?
            This action is permanent and cannot be undone. All associated data will be lost.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 sm:space-y-2 space-y-0">
          <Label
            htmlFor="confirmationName"
            className="text-sm font-medium text-gray-700"
          >
            To confirm deletion, enter member's name:{" "}
            <strong className="text-gray-800">{fullName}</strong>
          </Label>
          <Input
            id="confirmationName"
            value={confirmationName}
            onChange={(e) => setConfirmationName(e.target.value)}
            placeholder={fullName}
            className="border-gray-300 focus:border-red-500 focus:ring-red-500/50"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirmDelete(memberToDelete.id)}
            disabled={!isMatch || isDeleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
              </>
            ) : (
              "Delete Member"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 