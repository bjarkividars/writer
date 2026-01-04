import { useEditorContext } from "@/components/editor/EditorContext";
import ChatInput from "./ChatInput";
import { useChatContext, type ChatOption } from "./ChatContext";
import ChatMessages from "./ChatMessages";
import { useSessionContext } from "@/components/session/SessionContext";
import {
  useAppendMessageMutation,
  useSelectOptionMutation,
} from "@/hooks/orpc/useMessageMutations";
import { useCallback, useEffect } from "react";
import {
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
} from "@/components/ScrollArea";
import { useChatScroll } from "./useChatScroll";
import { useChatPanelContext } from "@/components/chat/ChatPanelContext";

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
  const { ensureSession, requestTitle, title, sessionId } = useSessionContext();
  const { registerScrollToBottom } = useChatPanelContext();
  const appendMessageMutation = useAppendMessageMutation();
  const selectOptionMutation = useSelectOptionMutation();
  const isChatAi = lastAiMode === "chat";
  const { scrollRef, bottomRef, scrollToBottom } = useChatScroll({
    messages,
    sessionId,
  });

  const requestTitleIfNeeded = useCallback(async () => {
    if (title) return;
    try {
      await requestTitle();
    } catch (error) {
      console.error("[chat] Failed to request title", error);
    }
  }, [requestTitle, title]);

  useEffect(() => {
    registerScrollToBottom(scrollToBottom);
    return () => {
      registerScrollToBottom(null);
    };
  }, [registerScrollToBottom, scrollToBottom]);

  const handleSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const sessionPromise = ensureSession();
    const userMessageId = addUserMessage(trimmed);
    const persistUserMessage = async () => {
      const sessionId = await sessionPromise;
      const saved = await appendMessageMutation.mutateAsync({
        sessionId,
        role: "user",
        content: trimmed,
      });
      setMessagePersistedId(userMessageId, saved.id);
      await requestTitleIfNeeded();
    };

    persistUserMessage().catch((error) => {
      console.error("[chat] Failed to persist user message", error);
    });
    const modelMessageId = startModelMessage("");
    let latestOptions: ChatOption[] = [];

    sessionPromise
      .then((sessionId) => {
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

            const persistModelMessage = async () => {
              const saved = await appendMessageMutation.mutateAsync({
                sessionId,
                role: "model",
                content: finalMessage,
                options:
                  latestOptions.length > 0
                    ? latestOptions.map(({ index, title, content }) => ({
                        index,
                        title,
                        content,
                      }))
                    : undefined,
              });
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
              await requestTitleIfNeeded();
            };

            persistModelMessage().catch((error) => {
              console.error("[chat] Failed to persist model message", error);
            });
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
      })
      .catch((error) => {
        console.error("[chat] Failed to start chat AI request", error);
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

    sessionPromise
      .then((sessionId) => {
        selectOptionMutation
          .mutateAsync({
            sessionId,
            messageId: persistedId,
            index: option.index,
          })
          .then((saved) => {
            setMessageSelectedOptionId(
              messageId,
              saved.selectedOptionId ?? null
            );
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

            const persistModelMessage = async () => {
              const saved = await appendMessageMutation.mutateAsync({
                sessionId,
                role: "model",
                content: finalMessage,
                options:
                  latestOptions.length > 0
                    ? latestOptions.map(({ index, title, content }) => ({
                        index,
                        title,
                        content,
                      }))
                    : undefined,
              });
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
              await requestTitleIfNeeded();
            };

            persistModelMessage().catch((error) => {
              console.error("[chat] Failed to persist model message", error);
            });
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
      })
      .catch((error) => {
        console.error("[chat] Failed to handle option selection", error);
      });
  };

  const isBusy =
    aiInteractionState === "loading" ||
    aiInteractionState === "streaming" ||
    aiInteractionState === "editing";

  return (
    <div className="flex h-full flex-col" key={sessionId}>
      <ScrollAreaRoot
        className="relative flex-1 min-h-0"
        showBottomFade={false}
      >
        <ScrollAreaViewport ref={scrollRef} className="h-full min-h-full">
          <ScrollAreaContent className="relative min-h-full">
            <ChatMessages
              messages={messages}
              aiInteractionState={aiInteractionState}
              isChatAi={isChatAi}
              isBusy={isBusy}
              onOptionSelect={handleOptionSelect}
              bottomRef={bottomRef}
            />
          </ScrollAreaContent>
        </ScrollAreaViewport>
        <ScrollAreaScrollbar>
          <ScrollAreaThumb />
        </ScrollAreaScrollbar>
      </ScrollAreaRoot>
      <div className="px-4">
        <ChatInput onSubmit={handleSubmit} disabled={isBusy} />
      </div>
    </div>
  );
}
