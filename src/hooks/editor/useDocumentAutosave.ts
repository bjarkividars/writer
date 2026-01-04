import { useCallback, useEffect, useRef } from "react";
import type { Editor, JSONContent } from "@tiptap/react";
import { useSaveDocumentMutation } from "@/hooks/orpc/useSessionMutations";

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
  const ensureRequestedRef = useRef(false);
  const onSavedRef = useRef<typeof onSaved>(onSaved);
  const saveMutation = useSaveDocumentMutation();
  const mutateAsyncRef = useRef(saveMutation.mutateAsync);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  useEffect(() => {
    mutateAsyncRef.current = saveMutation.mutateAsync;
  }, [saveMutation.mutateAsync]);

  const flushSave = useCallback(async () => {
    console.log("[autosave] Flush requested");
    if (isSavingRef.current || !pendingContentRef.current) {
      console.log("[autosave] Flush skipped", {
        isSaving: isSavingRef.current,
        hasPending: !!pendingContentRef.current,
      });
      return;
    }

    const content = pendingContentRef.current;
    pendingContentRef.current = null;
    const serialized = JSON.stringify(content);
    if (serialized === lastSavedRef.current) {
      console.log("[autosave] Skipping save (no changes)");
      return;
    }

    isSavingRef.current = true;
    console.log("[autosave] Saving document...");
    try {
      const sessionId = await ensureSession();
      console.log("[autosave] Ensured session", sessionId);
      await mutateAsyncRef.current({ sessionId, content });
      lastSavedRef.current = serialized;
      console.log("[autosave] Save complete", sessionId);
      onSavedRef.current?.(sessionId, content, latestTextRef.current);
    } catch (error) {
      console.error("[autosave] Failed to save document", error);
      pendingContentRef.current = content;
    } finally {
      isSavingRef.current = false;
      if (pendingContentRef.current) {
        flushSave().catch((flushError) => {
          console.error("[autosave] Failed to flush queued save", flushError);
        });
      }
    }
  }, [ensureSession]);

  const scheduleSave = useCallback(() => {
    if (!editor) return;
    if (!ensureRequestedRef.current) {
      ensureRequestedRef.current = true;
      console.log("[autosave] Ensuring session...");
      ensureSession().catch((error) => {
        console.error("[autosave] Failed to ensure session", error);
        ensureRequestedRef.current = false;
      });
    }
    pendingContentRef.current = editor.getJSON();
    latestTextRef.current = editor.getText();
    console.log("[autosave] Scheduled save", {
      textLength: latestTextRef.current.length,
    });
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      console.log("[autosave] Debounce timer fired");
      flushSave().catch((flushError) => {
        console.error("[autosave] Failed to save document", flushError);
      });
    }, debounceMs);
  }, [editor, debounceMs, flushSave, ensureSession]);

  useEffect(() => {
    ensureRequestedRef.current = false;
  }, [ensureSession]);

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
