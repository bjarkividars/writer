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
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus: () => void;
  onCollapse: () => void;
  onSubmit: (query: string) => void;
};

export default function AssistantInput({
  expanded,
  disabled = false,
  loading = false,
  placeholder = "Ask AI...",
  value: controlledValue,
  onChange,
  onFocus,
  onCollapse,
  onSubmit,
}: AssistantInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (controlledValue !== undefined && onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  // Auto-resize based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  // Reset internal value when collapsed (using setTimeout to avoid sync setState in effect)
  useEffect(() => {
    if (!expanded && controlledValue === undefined) {
      const timer = setTimeout(() => {
        setInternalValue("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [expanded, controlledValue]);

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value);
      if (controlledValue === undefined) {
        setInternalValue("");
      }
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
        expanded ? "w-72" : "w-36"
      }`}
    >
      <ScrollAreaRoot className="w-full">
        <ScrollAreaViewport className="max-h-20 rounded-md">
          <ScrollAreaContent>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                if (!disabled) {
                  handleValueChange(e.target.value);
                }
              }}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              disabled={disabled}
              className="min-h-7 w-full resize-none overflow-hidden rounded-md bg-transparent py-1.5 pl-2 pr-8 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none align-middle disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </ScrollAreaContent>
        </ScrollAreaViewport>
      </ScrollAreaRoot>

      {expanded && (
        <div className="absolute right-0 top-0 h-full flex items-end ">
          {loading ? (
            <div className="flex h-6 w-6 items-center justify-center mb-1">
              <div className="animate-spin h-4 w-4 border-2 border-foreground border-t-transparent rounded-full" />
            </div>
          ) : (
            value.trim() && (
              <button
                type="button"
                onClick={handleSubmit}
                onMouseDown={(e) => e.preventDefault()}
                className="btn-primary btn-icon mb-1"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
