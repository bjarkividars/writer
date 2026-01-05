"use client";

import { useState, useRef, useEffect } from "react";
import { Tooltip } from "@base-ui/react";
import {
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
} from "@/components/ScrollArea";
import { ArrowUp, Command } from "lucide-react";
import { Button } from "@/components/Button";
import { useChatPanelContext } from "@/components/chat/ChatPanelContext";
import { useOnboardingTip } from "@/components/onboarding/OnboardingContext";

type ChatInputProps = {
  onSubmit: (value: string) => void;
  disabled?: boolean;
};

export default function ChatInput({
  onSubmit,
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { registerChatInput } = useChatPanelContext();
  const { tip, isActive: isShortcutTipActive, dismiss } = useOnboardingTip(
    "chat-shortcut-back-to-doc"
  );
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform);
  const showShortcutTip = isShortcutTipActive;
  const shortcutLabel = isMac ? "Cmd+J" : "Ctrl+J";
  const tipBody = tip.body.replace("{{shortcut}}", shortcutLabel);

  // Auto-resize based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [input]);

  useEffect(() => {
    registerChatInput(textareaRef.current);
    return () => registerChatInput(null);
  }, [registerChatInput]);

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
    <Tooltip.Root open={showShortcutTip}>
      <Tooltip.Trigger
        render={(triggerProps) => {
          const { ref: triggerRef, ...restTriggerProps } =
            triggerProps as React.ComponentPropsWithoutRef<"div"> & {
              ref?: React.Ref<HTMLDivElement>;
            };

          return (
            <div
              {...restTriggerProps}
              ref={triggerRef}
              className="relative pb-4 bg-background before:content-[''] before:absolute before:-top-4 before:left-0 before:right-0 before:h-4 before:bg-linear-to-b before:from-transparent before:to-background"
            >
              <form onSubmit={handleSubmit}>
                <div className="bg-surface rounded-lg min-h-[32px] flex items-stretch border border-border">
                  <ScrollAreaRoot className="w-full">
                    <ScrollAreaViewport className="max-h-[180px] rounded-md">
                      <ScrollAreaContent>
                        <div className="relative">
                          {!isFocused && input.length === 0 && (
                            <div className="pointer-events-none absolute left-3 right-3 top-1/2 flex -translate-y-1/2 items-center justify-between text-[10.5px] text-foreground/60">
                              <span className="text-sm text-foreground/40">
                                Ask for help…
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="inline-flex h-[18px] min-w-[22px] items-center justify-center gap-1 rounded-md border border-foreground/10 bg-foreground/5 px-1.5 font-medium text-foreground/70 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                                  {isMac ? (
                                    <Command className="h-3 w-3" />
                                  ) : (
                                    "Ctrl"
                                  )}
                                </span>
                                <span className="text-[13px] text-foreground/45">
                                  +
                                </span>
                                <span className="inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-md border border-foreground/10 bg-foreground/5 px-1.5 font-medium text-foreground/70 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                                  J
                                </span>
                              </div>
                            </div>
                          )}
                          <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onKeyDown={handleKeyDown}
                            disabled={disabled}
                            className="block w-full resize-none overflow-hidden rounded-md bg-transparent py-2.5 px-3 text-sm text-foreground focus:outline-none"
                            rows={1}
                          />
                        </div>
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
        }}
      />
      {showShortcutTip && (
        <Tooltip.Portal>
          <Tooltip.Positioner side="top" align="start" sideOffset={8}>
            <Tooltip.Popup className="rounded bg-foreground px-3 py-2 text-xs font-medium text-background shadow-md">
                <div className="max-w-[220px]">
                  <div className="mt-1 text-background/90">{tipBody}</div>
                <Button
                  type="button"
                  onClick={dismiss}
                  className="mt-2 inline-flex items-center text-[11px] font-semibold text-background/80 hover:text-background"
                >
                  {tip.cta}
                </Button>
              </div>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      )}
    </Tooltip.Root>
  );
}
