"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { ArrowRight } from "lucide-react";
import {
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaContent,
} from "@/components/ScrollArea";

type AssistantInputProps = {
  expanded: boolean;
  onFocus: () => void;
  onCollapse: () => void;
  onSubmit: (query: string) => void;
};

export default function AssistantInput({
  expanded,
  onFocus,
  onCollapse,
  onSubmit,
}: AssistantInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  // Reset value when collapsed (using setTimeout to avoid sync setState in effect)
  useEffect(() => {
    if (!expanded) {
      const timer = setTimeout(() => {
        setValue("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [expanded]);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value);
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCollapse();
    }
  };

  const handleFocus = () => {
    // Only trigger onFocus (which enters AI mode) if not already expanded
    if (!expanded) {
      onFocus();
    }
  };

  return (
    <div
      className={`relative flex items-center transition-all duration-200 ease-in-out ${
        expanded ? "w-60" : "w-24"
      }`}
    >
      <ScrollAreaRoot className="w-full">
        <ScrollAreaViewport className="max-h-20 rounded-md">
          <ScrollAreaContent>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI..."
              rows={1}
              className="min-h-7 w-full resize-none overflow-hidden rounded-md bg-transparent py-1.5 pl-2 pr-8 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none align-middle"
            />
          </ScrollAreaContent>
        </ScrollAreaViewport>
      </ScrollAreaRoot>

      {expanded && value.trim() && (
        <div className="absolute right-0 top-0 h-full flex items-end ">
            <button
              type="button"
              onClick={handleSubmit}
              onMouseDown={(e) => e.preventDefault()}
              className="flex h-6 w-6 items-center justify-center rounded bg-foreground text-background shadow-sm hover:opacity-90 mb-1"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
        </div>
      )}
    </div>
  );
}
