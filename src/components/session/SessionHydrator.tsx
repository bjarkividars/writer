"use client";

import { useEffect, useRef } from "react";
import { getSession } from "@/lib/api/client";
import { useSessionContext } from "@/components/session/SessionContext";
import { useChatContext } from "@/components/chat/ChatContext";
import { useEditorContext } from "@/components/editor/EditorContext";

export function SessionHydrator() {
  const { sessionId, sessionSource, setTitle, setHydrated } = useSessionContext();
  const { replaceMessages } = useChatContext();
  const { editor } = useEditorContext();
  const hydratedRef = useRef<string | null>(null);

  useEffect(() => {
    // If no session from URL, mark as hydrated immediately
    if (!sessionId || sessionSource !== "url") {
      setHydrated(true);
      return;
    }

    if (hydratedRef.current === sessionId) {
      return;
    }

    if (!editor) {
      return;
    }

    hydratedRef.current = sessionId;
    let cancelled = false;

    getSession(sessionId)
      .then((data) => {
        if (cancelled) return;
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
            selectedOptionId: message.selectedOptionId ?? null,
            selectedOptionIndex: message.selectedOptionId ? 0 : undefined,
            streaming: false,
          }))
        );
        setTimeout(() => {
          if (!cancelled) setHydrated(true);
        }, 500);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("[session] Failed to load session", error);
          setHydrated(true); // Mark as hydrated even on error
        }
      });

    return () => {
      cancelled = true;
    };
  }, [editor, replaceMessages, sessionId, sessionSource, setTitle, setHydrated]);

  return null;
}
