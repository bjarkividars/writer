"use client";

import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/Dialog";
import { Button } from "@/components/Button";

type DeleteSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionTitle: string | null;
  onConfirm: () => void;
};

export default function DeleteSessionDialog({
  open,
  onOpenChange,
  sessionTitle,
  onConfirm,
}: DeleteSessionDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle className="text-lg font-semibold text-foreground mb-2">
            Delete session
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground  mb-6">
            Are you sure you want to delete{" "}
            <span className="font-bold text-foreground">
              {sessionTitle || "Untitled"}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
          <div className="flex gap-2 justify-end">
            <DialogClose className="btn-secondary btn-md">Cancel</DialogClose>
            <Button onClick={handleConfirm} className="btn-danger btn-md">
              Delete
            </Button>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
