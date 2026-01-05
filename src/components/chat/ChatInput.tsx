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
import { ArrowUp, Command, Plus, X } from "lucide-react";
import { Button } from "@/components/Button";
import { useChatPanelContext } from "@/components/chat/ChatPanelContext";
import { useOnboardingTip } from "@/components/onboarding/OnboardingContext";
import type { ChatAttachmentItem } from "@/components/chat/useChatAttachments";

type ChatInputProps = {
  onSubmit: (value: string) => void;
  onSelectAttachment?: (file: File) => void | Promise<void>;
  onRemoveAttachment?: (id: string) => void;
  attachments?: ChatAttachmentItem[];
  disabled?: boolean;
  submitDisabled?: boolean;
};

export default function ChatInput({
  onSubmit,
  onSelectAttachment,
  onRemoveAttachment,
  attachments = [],
  disabled = false,
  submitDisabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { registerChatInput } = useChatPanelContext();
  const {
    tip,
    isActive: isShortcutTipActive,
    dismiss,
  } = useOnboardingTip("chat-shortcut-back-to-doc");
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

  useEffect(() => {
    if (!disabled) return;
    setTimeout(() => {
      setIsFocused(false);
    }, 0);
    textareaRef.current?.blur();
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || submitDisabled) return;

    onSubmit(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !submitDisabled) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAttachmentClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleAttachmentChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !onSelectAttachment) return;
    await onSelectAttachment(file);
    event.target.value = "";
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
                <div className="bg-surface rounded-lg min-h-[32px] flex flex-col border border-border">
                  {attachments.length > 0 && (
                    <div className=" px-3 pt-2.5 pb-1">
                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2.5 -mb-2.5">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="relative flex shrink-0 items-center gap-2 rounded-full border border-border/80 bg-muted/70 pl-3.5 pr-2 py-1.5 text-xs text-foreground backdrop-blur-sm transition-all hover:bg-muted"
                          >
                            <span className="max-w-[180px] truncate font-medium">
                              {attachment.name}
                            </span>
                            <Button
                              type="button"
                              onClick={() =>
                                onRemoveAttachment?.(attachment.id)
                              }
                              className="btn-ghost btn-icon h-4 w-4 rounded-full text-foreground/50 hover:text-foreground/80 hover:bg-foreground/10 transition-colors"
                              aria-label={`Remove ${attachment.name}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            {attachment.status === "uploading" && (
                              <progress
                                value={attachment.progress}
                                max={100}
                                className="absolute left-2 right-2 bottom-0.5 h-[2px] w-[calc(100%-1rem)] overflow-hidden rounded-full bg-border/40 appearance-none [&::-webkit-progress-bar]:bg-border/40 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-foreground/60 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-moz-progress-bar]:bg-foreground/60 [&::-moz-progress-bar]:rounded-full"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-stretch">
                  <div className="flex items-center pl-2">
                    <Button
                      type="button"
                      onClick={handleAttachmentClick}
                      className="btn-secondary btn-icon h-7 w-7"
                      aria-label="Attach document"
                      disabled={disabled}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleAttachmentChange}
                        className="hidden"
                      />
                    </div>
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
                      <ScrollAreaScrollbar className="mt-2">
                        <ScrollAreaThumb />
                      </ScrollAreaScrollbar>
                    </ScrollAreaRoot>
                    {input.trim() && (
                      <div className="flex shrink-0 items-end">
                        <div className="flex items-center justify-center h-[40px] pr-3">
                          <Button
                            type="submit"
                            disabled={submitDisabled}
                            className="btn-primary w-6 h-6 rounded-md cursor-pointer disabled:opacity-60"
                          >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  </div>
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
