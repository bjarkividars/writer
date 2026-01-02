"use client";

import { useState, useRef, useEffect } from "react";
import {
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
} from "@/components/ScrollArea";
import { ArrowUp } from "lucide-react";
import { Button } from "@base-ui/react";

type ChatInputProps = {
  onSubmit: (value: string) => void;
  disabled?: boolean;
};

export default function ChatInput({
  onSubmit,
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    onSubmit(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative pb-4 bg-background before:content-[''] before:absolute before:-top-4 before:left-0 before:right-0 before:h-4 before:bg-linear-to-b before:from-transparent before:to-background">
      <form onSubmit={handleSubmit}>
        <div className="bg-surface rounded-lg min-h-[32px] flex items-stretch border border-border">
          <ScrollAreaRoot className="w-full">
            <ScrollAreaViewport className="max-h-[180px] rounded-md">
              <ScrollAreaContent>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message here..."
                  disabled={disabled}
                  className="block w-full resize-none overflow-hidden rounded-md bg-transparent py-2.5 px-3 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none"
                  rows={1}
                />
              </ScrollAreaContent>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar>
              <ScrollAreaThumb />
            </ScrollAreaScrollbar>
          </ScrollAreaRoot>
          {input.trim() && (
            <div className="flex shrink-0 items-end">
              <div className="flex items-center justify-center h-[40px] pr-3">
                <Button
                  type="submit"
                  disabled={disabled}
                  className="btn-primary w-6 h-6 rounded-md cursor-pointer disabled:opacity-60"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
