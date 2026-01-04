"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Menu } from "@/components/Menu";

type SessionItemMenuProps = {
  onRename: () => void;
  onDelete: () => void;
};

export default function SessionItemMenu({
  onRename,
  onDelete,
}: SessionItemMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger
        render={(props) => (
          <Button
            {...props}
            className="btn-ghost btn-icon opacity-0 group-hover:opacity-100 transition-opacity data-pressed:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              props.onClick?.(event);
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        )}
      />

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4}>
          <Menu.Popup className="min-w-[160px]">
            <div className="flex flex-col">
              <Menu.Item
                onClick={onRename}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-foreground outline-none hover:bg-hover data-highlighted:bg-hover cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                Rename
              </Menu.Item>
              <Menu.Item
                onClick={onDelete}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-danger outline-none hover:bg-hover data-highlighted:bg-hover cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Menu.Item>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
