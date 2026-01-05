"use client";

import { ModelMessage, UserMessage } from "./ChatMessage";
import ChatEmptyState from "./ChatEmptyState";
import ChatOptions from "./ChatOptions";
import type { ChatMessage, ChatOption } from "./ChatContext";
import type { RefObject } from "react";
import { FileText } from "lucide-react";

type ChatMessagesProps = {
  messages: ChatMessage[];
  aiInteractionState: "idle" | "loading" | "streaming" | "editing" | "complete";
  isChatAi: boolean;
  isBusy: boolean;
  onOptionSelect: (
    messageId: string,
    persistedId: string | undefined,
    option: ChatOption,
    index: number
  ) => void;
  bottomRef: RefObject<HTMLDivElement | null>;
};

export default function ChatMessages({
  messages,
  aiInteractionState,
  isChatAi,
  isBusy,
  onOptionSelect,
  bottomRef,
}: ChatMessagesProps) {
  const renderModelContent = (message: {
    content: string;
    streaming: boolean;
  }) => {
    const trimmed = message.content.trim();
    if (!message.streaming || trimmed.length > 0) {
      return message.content;
    }

    if (aiInteractionState === "editing" && isChatAi) {
      return (
        <span className="text-xs text-muted-foreground">
          Editing document...
        </span>
      );
    }

    if (aiInteractionState === "loading" && isChatAi) {
      return (
        <span className="flex items-center gap-1 text-muted-foreground translate-y-2">
          <span className="inline-block h-1 w-1 rounded-full bg-current animate-bounce" />
          <span className="inline-block h-1 w-1 rounded-full bg-current animate-bounce [animation-delay:120ms]" />
          <span className="inline-block h-1 w-1 rounded-full bg-current animate-bounce [animation-delay:240ms]" />
        </span>
      );
    }

    return null;
  };

  const messagesEmpty = messages.length === 0;
  const renderAttachments = (attachments?: ChatMessage["attachments"]) => {
    if (!attachments?.length) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.key}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 text-[11px] text-foreground/80"
          >
            <FileText className="h-3 w-3 text-foreground/60" />
            <span className="max-w-[180px] truncate font-medium">
              {attachment.originalName ?? "Attachment"}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-full flex-col gap-4 px-4">
      <div
        className={
          messagesEmpty
            ? "flex flex-1 items-center justify-center pt-10"
            : "flex flex-1 flex-col gap-5 py-10"
        }
      >
        {messagesEmpty ? (
          <ChatEmptyState />
        ) : (
          messages.map((message, index) => {
            if (message.role !== "model") {
              return (
                <UserMessage key={message.id}>
                  <div className="flex flex-col gap-2">
                    <div>{message.content}</div>
                    {renderAttachments(message.attachments)}
                  </div>
                </UserMessage>
              );
            }

            const isLatest = index === messages.length - 1;
            const hasOptions = (message.options?.length ?? 0) > 0;
            const selectedIndex =
              message.selectedOptionIndex ??
              (message.selectedOptionId ? 0 : undefined);
            const persistedId =
              message.persistedId ??
              (message.id.startsWith("msg-") ? undefined : message.id);
            const canSelect =
              isLatest &&
              !isBusy &&
              !message.streaming &&
              selectedIndex === undefined;

            return (
              <ModelMessage key={message.id}>
                <div className="flex flex-col gap-3">
                  {renderModelContent(message)}
                  {renderAttachments(message.attachments)}
                  {hasOptions ? (
                    <ChatOptions
                      options={message.options ?? []}
                      selectedIndex={selectedIndex}
                      disabled={!canSelect}
                      onSelect={(option, optionIndex) =>
                        onOptionSelect(
                          message.id,
                          persistedId,
                          option,
                          option.index ?? optionIndex
                        )
                      }
                    />
                  ) : null}
                </div>
              </ModelMessage>
            );
          })
        )}
      </div>
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
