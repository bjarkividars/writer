import ChatInput from "./ChatInput";
import { ModelMessage, UserMessage } from "./ChatMessage";

export default function Chat() {
  return (
    <div className="flex min-h-full flex-col gap-4 px-4">
      <div className="flex flex-1 flex-col gap-3 pt-4">
        {Array.from({ length: 100 }).map((_, i) =>
          i % 2 === 0 ? (
            <ModelMessage key={i}>Here is message {i + 1}</ModelMessage>
          ) : (
            <UserMessage key={i}>Here is message {i + 1}</UserMessage>
          )
        )}
      </div>
      <ChatInput />
    </div>
  );
}
