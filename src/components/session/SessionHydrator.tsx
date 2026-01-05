"use client";

import { useEffect, useRef } from "react";
import { useSessionContext } from "@/components/session/SessionContext";
import { useChatContext } from "@/components/chat/ChatContext";
import { useEditorContext } from "@/components/editor/EditorContext";
import { useSessionQuery } from "@/hooks/orpc/useSessions";

export function SessionHydrator() {
  const { sessionId, sessionSource, setTitle, setHydrated } = useSessionContext();
  const { replaceMessages } = useChatContext();
  const { editor } = useEditorContext();
  const hydratedRef = useRef<string | null>(null);

  const sessionQuery = useSessionQuery(
    sessionId ? { sessionId } : null,
    sessionSource === "url" && !!editor
  );

  useEffect(() => {
    // If no session from URL, mark as hydrated immediately
    if (!sessionId || sessionSource !== "url") {
      setHydrated(true);
      return;
    }

    if (!editor) {
      return;
    }

    if (sessionQuery.error) {
      console.error("[session] Failed to load session", sessionQuery.error);
      setHydrated(true);
      return;
    }

    if (!sessionQuery.data) {
      return;
    }

    if (hydratedRef.current === sessionId) {
      return;
    }

    hydratedRef.current = sessionId;
    const data = sessionQuery.data;
    const content = data.document ?? "";
    editor.commands.setContent(content, { emitUpdate: false });
    setTitle(data.title ?? null);
    replaceMessages(
      data.messages.map((message) => ({
        id: message.id,
        persistedId: message.id,
        role: message.role,
        content: message.content,
        options: message.options,
        attachments: message.attachments,
        selectedOptionId: message.selectedOptionId ?? null,
        selectedOptionIndex: message.selectedOptionId ? 0 : undefined,
        streaming: false,
      }))
    );
    const timeout = setTimeout(() => {
      setHydrated(true);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    editor,
    replaceMessages,
    sessionId,
    sessionSource,
    setTitle,
    setHydrated,
    sessionQuery.data,
    sessionQuery.error,
  ]);

  return null;
}
