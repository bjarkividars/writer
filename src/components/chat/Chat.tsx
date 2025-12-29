import { useEditorContext } from "@/components/editor/EditorContext";
import ChatInput from "./ChatInput";
import { ModelMessage, UserMessage } from "./ChatMessage";
import { useChatContext, type ChatOption } from "./ChatContext";
import ChatEmptyState from "./ChatEmptyState";
import ChatOptions from "./ChatOptions";
import { useSessionContext } from "@/components/session/SessionContext";
import { appendMessage, selectMessageOption as persistOptionSelection } from "@/lib/api/client";

const TITLE_MESSAGE_THRESHOLD = 2;

export default function Chat() {
  const { submitAiInstruction, aiInteractionState, lastAiMode } =
    useEditorContext();
  const {
    messages,
    addUserMessage,
    startModelMessage,
    setMessageContent,
    setMessageOptions,
    setMessagePersistedId,
    setMessageSelectedOptionId,
    selectMessageOption,
    finishMessage,
  } = useChatContext();
  const { ensureSession, requestTitle, title } = useSessionContext();
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
    const userMessageId = addUserMessage(trimmed);
    const nextUserCount =
      messages.filter((message) => message.role === "user").length + 1;
    void sessionPromise
      .then((sessionId) => appendMessage(sessionId, "user", trimmed))
      .then((saved) => {
        setMessagePersistedId(userMessageId, saved.id);
        if (!title && nextUserCount >= TITLE_MESSAGE_THRESHOLD) {
          void requestTitle();
        }
      })
      .catch((error) => {
        console.error("[chat] Failed to persist user message", error);
      });
    const modelMessageId = startModelMessage("");
    let latestOptions: ChatOption[] = [];

    void sessionPromise.then((sessionId) => {
      submitAiInstruction(trimmed, {
        mode: "chat",
        sessionId,
        onMessageUpdate: (message) => {
          setMessageContent(modelMessageId, message);
        },
        onMessageComplete: (message) => {
          const trimmedMessage = message.trim();
          const finalMessage =
            trimmedMessage.length > 0
              ? trimmedMessage
              : latestOptions.length > 0
                ? "Choose one option to continue."
                : "Edits applied.";
          setMessageContent(modelMessageId, finalMessage);
          finishMessage(modelMessageId);
          void sessionPromise.then((sessionId) =>
            appendMessage(
              sessionId,
              "model",
              finalMessage,
              latestOptions.length > 0
                ? latestOptions.map(({ index, title, content }) => ({
                    index,
                    title,
                    content,
                  }))
                : undefined
            )
              .then((saved) => {
                setMessagePersistedId(modelMessageId, saved.id);
                setMessageSelectedOptionId(
                  modelMessageId,
                  saved.selectedOptionId ?? null
                );
                setMessageOptions(
                  modelMessageId,
                  saved.options.map((option) => ({
                    id: option.id,
                    index: option.index,
                    title: option.title,
                    content: option.content,
                  }))
                );
              })
              .catch((error) => {
                console.error("[chat] Failed to persist model message", error);
              })
          );
        },
        onOptionsUpdate: (options) => {
          const mapped = options.map((option, index) => ({
            index,
            title: option.title,
            content: option.content,
          }));
          latestOptions = mapped;
          setMessageOptions(modelMessageId, mapped);
        },
        onOptionsComplete: (options) => {
          const mapped = options.map((option, index) => ({
            index,
            title: option.title,
            content: option.content,
          }));
          latestOptions = mapped;
          setMessageOptions(modelMessageId, mapped);
        },
      });
    });
  };

  const handleOptionSelect = (
    messageId: string,
    persistedId: string | undefined,
    option: ChatOption,
    index: number
  ) => {
    if (!persistedId) return;
    selectMessageOption(messageId, index);

    const title = option.title.trim();
    const content = option.content.trim();
    const instructionParts = ["Use this option:"];

    if (title) {
      instructionParts.push(title);
    }
    if (content) {
      instructionParts.push(`— ${content}`);
    }

    const instruction = instructionParts.join(" ");
    const sessionPromise = ensureSession();
    const modelMessageId = startModelMessage("");
    let latestOptions: ChatOption[] = [];

    void sessionPromise.then((sessionId) => {
      void persistOptionSelection(sessionId, persistedId, option.index)
        .then((saved) => {
          setMessageSelectedOptionId(messageId, saved.selectedOptionId ?? null);
          setMessageOptions(
            messageId,
            saved.options.map((item) => ({
              id: item.id,
              index: item.index,
              title: item.title,
              content: item.content,
            }))
          );
        })
        .catch((error) => {
          console.error("[chat] Failed to persist option selection", error);
        });
      submitAiInstruction(instruction, {
        mode: "chat",
        sessionId,
        onMessageUpdate: (message) => {
          setMessageContent(modelMessageId, message);
        },
        onMessageComplete: (message) => {
          const trimmedMessage = message.trim();
          const finalMessage =
            trimmedMessage.length > 0
              ? trimmedMessage
              : latestOptions.length > 0
                ? "Choose one option to continue."
                : "Edits applied.";
          setMessageContent(modelMessageId, finalMessage);
          finishMessage(modelMessageId);
          void sessionPromise.then((sessionId) =>
            appendMessage(
              sessionId,
              "model",
              finalMessage,
              latestOptions.length > 0
                ? latestOptions.map(({ index, title, content }) => ({
                    index,
                    title,
                    content,
                  }))
                : undefined
            )
              .then((saved) => {
                setMessagePersistedId(modelMessageId, saved.id);
                setMessageSelectedOptionId(
                  modelMessageId,
                  saved.selectedOptionId ?? null
                );
                setMessageOptions(
                  modelMessageId,
                  saved.options.map((item) => ({
                    id: item.id,
                    index: item.index,
                    title: item.title,
                    content: item.content,
                  }))
                );
              })
              .catch((error) => {
                console.error("[chat] Failed to persist model message", error);
              })
          );
        },
        onOptionsUpdate: (options) => {
          const mapped = options.map((item, optionIndex) => ({
            index: optionIndex,
            title: item.title,
            content: item.content,
          }));
          latestOptions = mapped;
          setMessageOptions(modelMessageId, mapped);
        },
        onOptionsComplete: (options) => {
          const mapped = options.map((item, optionIndex) => ({
            index: optionIndex,
            title: item.title,
            content: item.content,
          }));
          latestOptions = mapped;
          setMessageOptions(modelMessageId, mapped);
        },
      });
    });
  };

  const messagesEmpty = messages.length === 0;
  const isBusy =
    aiInteractionState === "loading" ||
    aiInteractionState === "streaming" ||
    aiInteractionState === "editing";

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
          messages.map((message, index) => {
            if (message.role !== "model") {
              return <UserMessage key={message.id}>{message.content}</UserMessage>;
            }

            const isLatest = index === messages.length - 1;
            const hasOptions = (message.options?.length ?? 0) > 0;
            const selectedIndex =
              message.selectedOptionIndex ??
              (message.selectedOptionId ? 0 : undefined);
            const persistedId =
              message.persistedId ?? (message.id.startsWith("msg-") ? undefined : message.id);
            const canSelect =
              isLatest &&
              !isBusy &&
              !message.streaming &&
              selectedIndex === undefined &&
              !!persistedId;

            return (
              <ModelMessage key={message.id}>
                <div className="flex flex-col gap-3">
                  {renderModelContent(message)}
                  {hasOptions ? (
                    <ChatOptions
                      options={message.options ?? []}
                      selectedIndex={selectedIndex}
                      disabled={!canSelect}
                      onSelect={(option, index) =>
                        handleOptionSelect(
                          message.id,
                          persistedId,
                          option,
                          option.index ?? index
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
      <ChatInput
        onSubmit={handleSubmit}
        disabled={isBusy}
      />
    </div>
  );
}
