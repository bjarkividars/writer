import { useEditorContext } from "@/components/editor/EditorContext";
import ChatInput from "./ChatInput";
import { ModelMessage, UserMessage } from "./ChatMessage";
import { useChatContext } from "./ChatContext";
import ChatEmptyState from "./ChatEmptyState";
import { useSessionContext } from "@/components/session/SessionContext";
import { appendMessage } from "@/lib/api/client";

export default function Chat() {
  const { submitAiInstruction, aiInteractionState, lastAiMode } =
    useEditorContext();
  const {
    messages,
    addUserMessage,
    startModelMessage,
    setMessageContent,
    finishMessage,
  } = useChatContext();
  const { ensureSession } = useSessionContext();
  const isChatAi = lastAiMode === "chat";

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

  const handleSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const sessionPromise = ensureSession();
    addUserMessage(trimmed);
    void sessionPromise.then((sessionId) =>
      appendMessage(sessionId, "user", trimmed)
    );
    const modelMessageId = startModelMessage("");

    void sessionPromise.then((sessionId) => {
      submitAiInstruction(trimmed, {
        mode: "chat",
        sessionId,
        onMessageUpdate: (message) => {
          setMessageContent(modelMessageId, message);
        },
        onMessageComplete: (message) => {
          const finalMessage =
            message.trim().length > 0 ? message : "Edits applied.";
          setMessageContent(modelMessageId, finalMessage);
          finishMessage(modelMessageId);
          void sessionPromise.then((sessionId) =>
            appendMessage(sessionId, "model", finalMessage)
          );
        },
      });
    });
  };

  const messagesEmpty = messages.length === 0;

  return (
    <div className="flex min-h-full flex-col gap-4 px-4">
      <div
        className={
          messagesEmpty
            ? "flex flex-1 items-center justify-center pt-16"
            : "flex flex-1 flex-col gap-3 pt-16"
        }
      >
        {messagesEmpty ? (
          <ChatEmptyState />
        ) : (
          messages.map((message) =>
            message.role === "model" ? (
              <ModelMessage key={message.id}>
                {renderModelContent(message)}
              </ModelMessage>
            ) : (
              <UserMessage key={message.id}>{message.content}</UserMessage>
            )
          )
        )}
      </div>
      <ChatInput
        onSubmit={handleSubmit}
        disabled={
          aiInteractionState === "loading" ||
          aiInteractionState === "streaming" ||
          aiInteractionState === "editing"
        }
      />
    </div>
  );
}
