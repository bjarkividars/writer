import { useEditorContext } from "@/components/editor/EditorContext";
import ChatInput from "./ChatInput";
import { ModelMessage, UserMessage } from "./ChatMessage";
import { useChatContext } from "./ChatContext";

export default function Chat() {
  const { submitAiInstruction, aiInteractionState } = useEditorContext();
  const {
    messages,
    addUserMessage,
    startModelMessage,
    setMessageContent,
    finishMessage,
  } = useChatContext();

  const handleSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    addUserMessage(trimmed);
    const modelMessageId = startModelMessage("");

    submitAiInstruction(trimmed, {
      mode: "chat",
      onMessageUpdate: (message) => {
        setMessageContent(modelMessageId, message);
      },
      onMessageComplete: (message) => {
        const finalMessage =
          message.trim().length > 0 ? message : "Edits applied.";
        setMessageContent(modelMessageId, finalMessage);
        finishMessage(modelMessageId);
      },
    });
  };

  return (
    <div className="flex min-h-full flex-col gap-4 px-4">
      <div className="flex flex-1 flex-col gap-3 pt-4">
        {messages.map((message) =>
          message.role === "model" ? (
            <ModelMessage key={message.id}>{message.content}</ModelMessage>
          ) : (
            <UserMessage key={message.id}>{message.content}</UserMessage>
          )
        )}
      </div>
      <ChatInput
        onSubmit={handleSubmit}
        disabled={
          aiInteractionState === "loading" || aiInteractionState === "streaming"
        }
      />
    </div>
  );
}
