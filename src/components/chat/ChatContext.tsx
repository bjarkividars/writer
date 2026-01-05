"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AttachmentInput } from "@/lib/api/schemas";

export type ChatOption = {
  id?: string;
  title: string;
  content: string;
  index: number;
};

export type ChatMessage = {
  id: string;
  persistedId?: string;
  role: "user" | "model";
  content: string;
  streaming: boolean;
  options?: ChatOption[];
  attachments?: AttachmentInput[];
  selectedOptionIndex?: number;
  selectedOptionId?: string | null;
};

type ChatContextValue = {
  messages: ChatMessage[];
  addUserMessage: (content: string, attachments?: AttachmentInput[]) => string;
  startModelMessage: (initialContent?: string) => string;
  setMessageContent: (id: string, content: string) => void;
  setMessageOptions: (id: string, options: ChatOption[]) => void;
  setMessagePersistedId: (id: string, persistedId: string) => void;
  setMessageSelectedOptionId: (id: string, selectedOptionId: string | null) => void;
  selectMessageOption: (id: string, index: number) => void;
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

  const addUserMessage = useCallback(
    (content: string, attachments?: AttachmentInput[]) => {
      const id = createMessageId();
      setMessages((prev) => [
        ...prev,
        { id, role: "user", content, streaming: false, attachments },
      ]);
      return id;
    },
    []
  );

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

  const setMessageOptions = useCallback((id: string, options: ChatOption[]) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, options } : message
      )
    );
  }, []);

  const setMessagePersistedId = useCallback((id: string, persistedId: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, persistedId } : message
      )
    );
  }, []);

  const setMessageSelectedOptionId = useCallback(
    (id: string, selectedOptionId: string | null) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id ? { ...message, selectedOptionId } : message
        )
      );
    },
    []
  );

  const selectMessageOption = useCallback((id: string, index: number) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== id) return message;
        const options = message.options ?? [];
        const selected =
          options.find((option) => option.index === index) ?? options[index];
        if (!selected) return message;
        return {
          ...message,
          options: [selected],
          selectedOptionIndex: 0,
        };
      })
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
      setMessageOptions,
      setMessagePersistedId,
      setMessageSelectedOptionId,
      selectMessageOption,
      finishMessage,
      replaceMessages,
    }),
    [
      messages,
      addUserMessage,
      startModelMessage,
      setMessageContent,
      setMessageOptions,
      setMessagePersistedId,
      setMessageSelectedOptionId,
      selectMessageOption,
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
