"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { ChatMessage } from "./ChatContext";

type UseChatScrollOptions = {
  messages: ChatMessage[];
  sessionId: string | null;
};

export function useChatScroll({ messages, sessionId }: UseChatScrollOptions) {
  const isAtBottomRef = useRef(true);
  const initialScrollRef = useRef(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const bottom = bottomRef.current;
    const scrollEl = scrollRef.current;
    if (!bottom || !scrollEl) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollEl.scrollTop = scrollEl.scrollHeight;
        bottom.scrollIntoView({ block: "end" });
      });
    });
  }, []);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const updateScrollState = () => {
      const offset =
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      isAtBottomRef.current = offset <= 8;
    };

    updateScrollState();
    scrollEl.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      scrollEl.removeEventListener("scroll", updateScrollState);
    };
  }, []);

  useEffect(() => {
    initialScrollRef.current = true;
    isAtBottomRef.current = true;
  }, [sessionId]);

  useLayoutEffect(() => {
    if (initialScrollRef.current) {
      scrollToBottom();
      initialScrollRef.current = false;
      return;
    }

    if (!isAtBottomRef.current) return;
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || typeof ResizeObserver === "undefined") return;

    const handleResize = () => {
      if (initialScrollRef.current || isAtBottomRef.current) {
        scrollToBottom();
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(scrollEl);
    return () => {
      observer.disconnect();
    };
  }, [scrollToBottom]);

  return { scrollRef, bottomRef };
}
