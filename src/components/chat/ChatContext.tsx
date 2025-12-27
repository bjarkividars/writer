"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "model";
  content: string;
  streaming: boolean;
};

type ChatContextValue = {
  messages: ChatMessage[];
  addUserMessage: (content: string) => string;
  startModelMessage: (initialContent?: string) => string;
  setMessageContent: (id: string, content: string) => void;
  finishMessage: (id: string) => void;
  replaceMessages: (messages: ChatMessage[]) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

let messageCounter = 0;
const createMessageId = () => {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addUserMessage = useCallback((content: string) => {
    const id = createMessageId();
    setMessages((prev) => [
      ...prev,
      { id, role: "user", content, streaming: false },
    ]);
    return id;
  }, []);

  const startModelMessage = useCallback((initialContent = "") => {
    const id = createMessageId();
    setMessages((prev) => [
      ...prev,
      { id, role: "model", content: initialContent, streaming: true },
    ]);
    return id;
  }, []);

  const setMessageContent = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, content } : message
      )
    );
  }, []);

  const finishMessage = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, streaming: false } : message
      )
    );
  }, []);

  const replaceMessages = useCallback((nextMessages: ChatMessage[]) => {
    setMessages(nextMessages);
  }, []);

  const value = useMemo(
    () => ({
      messages,
      addUserMessage,
      startModelMessage,
      setMessageContent,
      finishMessage,
      replaceMessages,
    }),
    [
      messages,
      addUserMessage,
      startModelMessage,
      setMessageContent,
      finishMessage,
      replaceMessages,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}
