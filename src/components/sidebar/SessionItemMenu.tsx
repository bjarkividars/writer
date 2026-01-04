"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Popover } from "@base-ui/react";
import { Button } from "@/components/Button";

type SessionItemMenuProps = {
  onRename: () => void;
  onDelete: () => void;
};

export default function SessionItemMenu({
  onRename,
  onDelete,
}: SessionItemMenuProps) {
  const [open, setOpen] = useState(false);

  const handleRename = () => {
    setOpen(false);
    onRename();
  };

  const handleDelete = () => {
    setOpen(false);
    onDelete();
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className="btn-ghost btn-icon opacity-0 group-hover:opacity-100 transition-opacity data-pressed:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <MoreVertical className="w-4 h-4" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={4}>
          <Popover.Popup className="rounded-md border border-border bg-background shadow-lg min-w-[160px] z-50">
            <div className="flex flex-col">
              <Button
                onClick={handleRename}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-hover transition-colors text-left w-full cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                Rename
              </Button>
              <Button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-hover transition-colors text-left w-full cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
