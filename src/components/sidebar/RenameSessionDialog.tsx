"use client";

import { useState, useEffect } from "react";
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

type RenameSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTitle: string | null;
  onConfirm: (newTitle: string) => void;
};

export default function RenameSessionDialog({
  open,
  onOpenChange,
  currentTitle,
  onConfirm,
}: RenameSessionDialogProps) {
  const [title, setTitle] = useState("");

  // Update title when dialog opens with new currentTitle
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(currentTitle || "");
    }
  }, [open, currentTitle]);

  const handleConfirm = () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle) {
      onConfirm(trimmedTitle);
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle className="text-lg font-semibold text-foreground mb-2">
            Rename session
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground-secondary mb-4">
            Enter a new name for this session.
          </DialogDescription>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Session name"
            autoFocus
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent mb-6"
          />
          <div className="flex gap-2 justify-end">
            <DialogClose className="btn-secondary btn-md">Cancel</DialogClose>
            <Button
              onClick={handleConfirm}
              disabled={!title.trim()}
              className="btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rename
            </Button>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
