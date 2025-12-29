"use client";

import type { ChatOption } from "./ChatContext";

type ChatOptionsProps = {
  options: ChatOption[];
  selectedIndex?: number;
  disabled?: boolean;
  onSelect: (option: ChatOption, index: number) => void;
};

export default function ChatOptions({
  options,
  selectedIndex,
  disabled = false,
  onSelect,
}: ChatOptionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        return (
          <button
            key={option.id ?? `${option.index}-${option.title}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option, index)}
            className={
              isSelected
                ? "flex w-full flex-col gap-1 rounded-lg border border-foreground/30 bg-surface px-3 py-2 text-left text-sm text-foreground"
                : "flex w-full flex-col gap-1 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition hover:border-foreground/20 hover:bg-surface/60 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            }
          >
            {option.title ? (
              <span className="text-sm font-medium text-foreground">
                {option.title}
              </span>
            ) : null}
            {option.content ? (
              <span className="text-xs text-muted-foreground">
                {option.content}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
