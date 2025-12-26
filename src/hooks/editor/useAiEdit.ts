import { useRef, useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { buildBlockMap } from "@/lib/ai/blockMap";
import type { BlockItem, BlockType } from "@/lib/ai/schemas";
import { EditRequest } from "@/lib/ai/schemas";
import type { EditState } from "@/hooks/editor/aiEdit/types";
import { dispatchOperation } from "@/hooks/editor/aiEdit/dispatchOperation";

type AiInteractionState = "idle" | "loading" | "streaming" | "complete";

/**
 * Return type of useAiEdit hook
 */
export type UseAiEditResult = ReturnType<typeof useAiEdit>;

/**
 * Type guard to check if value is an array
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard for parsed edit data
 */
function isValidEdit(
  value: unknown
): value is { target?: unknown; operation?: unknown } {
  return typeof value === "object" && value !== null;
}

/**
 * Type guard for edit target
 */
function hasTargetFields(
  target: unknown
): target is {
  kind?: unknown;
  itemId?: unknown;
} {
  return typeof target === "object" && target !== null;
}

/**
 * Hook for AI-powered document editing with streaming
 *
 * Server sends block map as first chunk, then streams AI response.
 * Client resolves block items using the received map.
 */
export function useAiEdit(editor: Editor | null) {
  // Store block map from server
  const blockMapRef = useRef<BlockItem[]>([]);

  // Simple state tracking per edit
  const editsState = useRef<Map<number, EditState>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // React state for UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [aiInteractionState, setAiInteractionState] =
    useState<AiInteractionState>("idle");
  const [hasStartedStreaming, setHasStartedStreaming] = useState(false);

  /**
   * Resolve edit target to absolute positions using block map
   */
  const resolveTarget = useCallback(
    (
      target: unknown
    ): {
      from: number;
      to: number;
      blockType?: BlockType;
      headingLevel?: number;
      blockNum?: number;
    } | null => {
      if (!hasTargetFields(target)) return null;

      if (
        target.kind === "block-item" &&
        typeof target.itemId === "string" &&
        target.itemId !== ""
      ) {
        const item = blockMapRef.current.find((i) => i.id === target.itemId);
        if (!item) {
          console.warn(`[AI Edit] Block item not found: ${target.itemId}`);
          return null;
        }
        return {
          from: item.from,
          to: item.to,
          blockType: item.blockType,
          headingLevel: item.headingLevel,
          blockNum: item.blockNum,
        };
      }

      return null;
    },
    []
  );

  /**
   * Extract edits from partial JSON, including incomplete replacement text
   */
  const tryParsePartialJSON = useCallback(
    (text: string): { edits?: unknown[] } | null => {
      console.log("[STREAM] Trying to parse partial JSON:", text);
      // Try complete JSON parse first
      try {
        const parsed = JSON.parse(text) as unknown;
        if (typeof parsed === "object" && parsed !== null && "edits" in parsed) {
          const editsValue = (parsed as { edits: unknown }).edits;
          if (isArray(editsValue)) {
            return { edits: editsValue };
          }
        }
      } catch {
        // Fall through to partial extraction
      }

      // Extract partial edits using regex (replace only)
      const edits: unknown[] = [];

      // Find the start of each edit - look for target with kind field
      const editMatches = text.matchAll(/\{"target":\s*\{([^}]+)\}/g);

      for (const editMatch of editMatches) {
        try {
          const targetJson = `{${editMatch[1]}}`;
          const editStartPos = editMatch.index!;

          // Parse the target
          const target = JSON.parse(targetJson) as unknown;

          // Extract replacement text after this target
          const afterTarget = text.substring(editStartPos);
          const typeMatch = afterTarget.match(/"type"\s*:\s*"([^"]+)"/);
          if (!typeMatch || typeMatch[1] !== "replace") {
            continue;
          }

          const replacementMatch = afterTarget.match(/"replacement"\s*:\s*"([^"]*)"/);

          let replacement = "";
          if (replacementMatch) {
            // Found complete replacement with closing quote
            replacement = replacementMatch[1];
          } else {
            // Look for incomplete replacement without closing quote
            const incompleteMatch = afterTarget.match(/"replacement"\s*:\s*"([^"]*)/);
            if (incompleteMatch) {
              replacement = incompleteMatch[1];
            }
          }

          edits.push({
            target,
            operation: {
              type: "replace",
              replacement,
            },
          });
        } catch {
          // Skip invalid matches
        }
      }

      return edits.length > 0 ? { edits } : null;
    },
    []
  );

  /**
   * Process edits incrementally as they stream in
   */
  const processEdits = useCallback(
    (edits: unknown[]) => {
      if (!editor) return;

      let appliedAnyEdit = false;

      edits.forEach((edit, index) => {
        if (!isValidEdit(edit)) return;

        let state = editsState.current.get(index);

        // STEP 1: Resolve and store target (DON'T delete yet!)
        if (!state?.targetSeen && edit.target !== undefined) {
          const range = resolveTarget(edit.target);
          if (range) {
            const itemId =
              hasTargetFields(edit.target) &&
              typeof edit.target.itemId === "string"
                ? edit.target.itemId
                : undefined;

            // Store range without deleting
            editsState.current.set(index, {
              targetSeen: true,
              targetRange: { from: range.from, to: range.to },
              blockType: range.blockType,
              headingLevel: range.headingLevel,
              blockNum: range.blockNum,
              rangeDeleted: false, // Haven't deleted original yet
              replacementSeen: "",
              replacementLength: 0,
              itemId,
              operationApplied: false,
            });

            state = editsState.current.get(index)!;
          }
        }

        if (!state?.targetSeen || !state.targetRange) return;

        const applied = dispatchOperation({
          editor,
          state,
          operation: edit.operation,
          blockMap: blockMapRef.current,
          editsState: editsState.current,
        });

        if (applied) {
          appliedAnyEdit = true;
        }
      });

      // Notify streaming started on first edit
      if (appliedAnyEdit && !hasStartedStreaming) {
        setHasStartedStreaming(true);
        setAiInteractionState("streaming");
      }
    },
    [editor, resolveTarget, hasStartedStreaming]
  );

  /**
   * Stream edits from the API
   */
  const streamEdits = useCallback(
    async (payload: EditRequest) => {
      setIsLoading(true);
      setError(null);
      setHasStartedStreaming(false);
      setAiInteractionState("loading");
      editsState.current.clear();

      // Lock editor
      if (editor) {
        editor.setEditable(false);
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/ai/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let blockMapReceived = false;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse block map from first chunk
          if (!blockMapReceived && buffer.includes("\n")) {
            const lines = buffer.split("\n");
            const firstLine = lines[0];

            if (firstLine.includes("blockMap")) {
              try {
                const mapData = JSON.parse(firstLine) as { blockMap: BlockItem[] };
                blockMapRef.current = mapData.blockMap;
                console.log(
                  "[AI Edit] Received block map:",
                  mapData.blockMap.length,
                  "items"
                );

                // Remove block map from buffer
                buffer = lines.slice(1).join("\n");
                blockMapReceived = true;
              } catch (err) {
                console.error("[AI Edit] Failed to parse block map:", err);
              }
            }
          }

          // Try to parse accumulated buffer and process edits
          if (blockMapReceived) {
            const parsed = tryParsePartialJSON(buffer);
            if (parsed && parsed.edits) {
              processEdits(parsed.edits);
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("[AI Edit] Stream error:", err);
          setError(err as Error);
        }
      } finally {
        setIsLoading(false);
        if (editor) {
          editor.setEditable(true);
        }
        abortControllerRef.current = null;
        setAiInteractionState("complete");
      }
    },
    [editor, tryParsePartialJSON, processEdits]
  );

  /**
   * Run an AI edit based on an instruction
   */
  const run = useCallback(
    (instruction: string) => {
      if (!editor) {
        console.error("[AI Edit] Editor not available");
        return;
      }

      try {
        const { state } = editor;
        const { from, to, empty } = state.selection;

        // Get document text
        const documentText = editor.getText();
        const { items: blockMapItems } = buildBlockMap(editor);

        // Build selection info
        const selection =
          !empty && from !== to
            ? {
                from,
                to,
                text: state.doc.textBetween(from, to, " "),
              }
            : undefined;

        blockMapRef.current = blockMapItems;

        // Build and validate payload
        const payload = EditRequest.parse({
          instruction,
          selection,
          documentText,
          blockMap: blockMapItems,
        });

        // Start streaming
        streamEdits(payload);
      } catch (err) {
        console.error("[AI Edit] Failed to build request:", err);
        setError(err as Error);
      }
    },
    [editor, streamEdits]
  );

  /**
   * Stop streaming
   */
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsLoading(false);
    setAiInteractionState("idle");

    if (editor) {
      editor.setEditable(true);
    }
  }, [editor]);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    stop();
    editsState.current.clear();
    blockMapRef.current = [];
    setError(null);
    setAiInteractionState("idle");
  }, [stop]);

  return {
    run,
    isLoading,
    error,
    reset,
    stop,
    aiInteractionState,
  };
}
