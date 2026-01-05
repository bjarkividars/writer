"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePanelRef } from "react-resizable-panels";

type ChatPanelContextValue = {
  panelRef: ReturnType<typeof usePanelRef>;
  isChatCollapsed: boolean;
  setChatCollapsed: (collapsed: boolean) => void;
  openChatPanel: () => void;
  focusChatInput: () => void;
  isChatInputFocused: () => boolean;
  registerChatInput: (input: HTMLTextAreaElement | null) => void;
  scrollToBottom: () => void;
  registerScrollToBottom: (scroll: (() => void) | null) => void;
};

const ChatPanelContext = createContext<ChatPanelContextValue | null>(null);

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const panelRef = usePanelRef();
  const [isChatCollapsed, setChatCollapsed] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollToBottomRef = useRef<() => void>(() => {});

  const openChatPanel = useCallback(() => {
    panelRef.current?.expand();
    setChatCollapsed(false);
  }, [panelRef]);

  const registerChatInput = useCallback(
    (input: HTMLTextAreaElement | null) => {
      chatInputRef.current = input;
    },
    []
  );

  const focusChatInput = useCallback(() => {
    chatInputRef.current?.focus();
  }, []);

  const isChatInputFocused = useCallback(() => {
    if (typeof document === "undefined") return false;
    return document.activeElement === chatInputRef.current;
  }, []);

  const registerScrollToBottom = useCallback((scroll: (() => void) | null) => {
    scrollToBottomRef.current = scroll ?? (() => {});
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollToBottomRef.current();
  }, []);

  const value = useMemo(
    () => ({
      panelRef,
      isChatCollapsed,
      setChatCollapsed,
      openChatPanel,
      focusChatInput,
      isChatInputFocused,
      registerChatInput,
      scrollToBottom,
      registerScrollToBottom,
    }),
    [
      panelRef,
      isChatCollapsed,
      openChatPanel,
      focusChatInput,
      isChatInputFocused,
      registerChatInput,
      scrollToBottom,
      registerScrollToBottom,
    ]
  );

  return (
    <ChatPanelContext.Provider value={value}>
      {children}
    </ChatPanelContext.Provider>
  );
}

export function useChatPanelContext() {
  const context = useContext(ChatPanelContext);
  if (!context) {
    throw new Error("useChatPanelContext must be used within ChatPanelProvider");
  }
  return context;
}
