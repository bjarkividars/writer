import { useCallback, useEffect, useRef } from "react";
import type { Editor, JSONContent } from "@tiptap/react";
import { saveDocument } from "@/lib/api/client";

const DEFAULT_DEBOUNCE_MS = 1000;

export function useDocumentAutosave(
  editor: Editor | null,
  ensureSession: () => Promise<string>,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
  onSaved?: (sessionId: string, content: JSONContent, text: string) => void
) {
  const pendingContentRef = useRef<JSONContent | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const latestTextRef = useRef("");

  const flushSave = useCallback(async () => {
    if (isSavingRef.current || !pendingContentRef.current) {
      return;
    }

    const content = pendingContentRef.current;
    pendingContentRef.current = null;
    const serialized = JSON.stringify(content);
    if (serialized === lastSavedRef.current) {
      return;
    }

    isSavingRef.current = true;
    try {
      const sessionId = await ensureSession();
      await saveDocument(sessionId, content);
      lastSavedRef.current = serialized;
      onSaved?.(sessionId, content, latestTextRef.current);
    } catch (error) {
      console.error("[autosave] Failed to save document", error);
      pendingContentRef.current = content;
    } finally {
      isSavingRef.current = false;
      if (pendingContentRef.current) {
        void flushSave();
      }
    }
  }, [ensureSession, onSaved]);

  const scheduleSave = useCallback(() => {
    if (!editor) return;
    pendingContentRef.current = editor.getJSON();
    latestTextRef.current = editor.getText();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      void flushSave();
    }, debounceMs);
  }, [editor, debounceMs, flushSave]);

  useEffect(() => {
    if (!editor) return;

    editor.on("update", scheduleSave);
    return () => {
      editor.off("update", scheduleSave);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [editor, scheduleSave]);
}
