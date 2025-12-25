"use client";

import type { ReactNode } from "react";
import { Toolbar, Tooltip } from "@base-ui/react";

type ToolbarButtonProps = {
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export default function ToolbarButton({
  label,
  icon,
  active = false,
  disabled = false,
  onClick,
}: ToolbarButtonProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={(props) => (
          <Toolbar.Button
            {...props}
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              props.onMouseDown?.(e);
            }}
            onClick={(e) => {
              onClick();
              props.onClick?.(e);
              e.preventDefault();
              e.stopPropagation();
            }}
            className={[
              "flex h-7 w-7 items-center justify-center rounded transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-foreground opacity-50 hover:opacity-100 hover:bg-hover",
              disabled && "cursor-not-allowed opacity-30",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {icon}
          </Toolbar.Button>
        )}
      />
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={4}>
          <Tooltip.Popup className="rounded bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
