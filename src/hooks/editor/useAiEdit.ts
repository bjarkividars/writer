import { useRef, useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { buildBlockMap } from "@/lib/ai/blockMap";
import type { BlockItem, BlockType } from "@/lib/ai/schemas";
import { EditRequest } from "@/lib/ai/schemas";
import type { EditState } from "@/hooks/editor/aiEdit/types";
import { dispatchOperation } from "@/hooks/editor/aiEdit/dispatchOperation";
import { parsePartialEdits } from "@/hooks/editor/aiEdit/streamParser";

type AiInteractionState = "idle" | "loading" | "streaming" | "complete";

/**
 * Return type of useAiEdit hook
 */
export type UseAiEditResult = ReturnType<typeof useAiEdit>;

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

function getEditKey(index: number, edit: { target?: unknown; operation?: unknown }) {
  let key = `${index}`;

  if (hasTargetFields(edit.target)) {
    const itemId = edit.target.itemId;
    if (typeof itemId === "string" && itemId.length > 0) {
      key = `${key}:${itemId}`;
    }
  }

  const operation = edit.operation;
  const type =
    typeof operation === "object" && operation !== null && "type" in operation
      ? (operation as { type?: unknown }).type
      : undefined;
  if (typeof type === "string") {
    key = `${key}:${type}`;

    const position = (operation as { position?: unknown }).position;
    if (typeof position === "string") {
      key = `${key}:${position}`;
    }
  }

  return { key };
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
  const editsState = useRef<Map<string, EditState>>(new Map());
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
   * Process edits incrementally as they stream in
   */
  const processEdits = useCallback(
    (edits: unknown[]) => {
      if (!editor) return;

      let appliedAnyEdit = false;
      const insertAnchors = new Map<string, number>();

      edits.forEach((edit, index) => {
        if (!isValidEdit(edit)) return;

        const { key } = getEditKey(index, edit);
        let state = editsState.current.get(key);

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
            editsState.current.set(key, {
              targetSeen: true,
              targetRange: { from: range.from, to: range.to },
              blockType: range.blockType,
              headingLevel: range.headingLevel,
              blockNum: range.blockNum,
              rangeDeleted: false, // Haven't deleted original yet
              replacementSeen: "",
              replacementLength: 0,
              insertPos: undefined,
              insertedRange: null,
              itemsSeen: [],
              itemId,
              operationApplied: false,
            });

            state = editsState.current.get(key)!;
          }
        }

        if (!state?.targetSeen || !state.targetRange) return;

        const itemId = state.itemId;
        const operation = edit.operation;
        const operationType =
          typeof operation === "object" &&
          operation !== null &&
          "type" in operation
            ? (operation as { type?: unknown }).type
            : undefined;
        const position =
          typeof operation === "object" &&
          operation !== null &&
          "position" in operation
            ? (operation as { position?: unknown }).position
            : undefined;
        const anchorKey =
          typeof itemId === "string" &&
          itemId.length > 0 &&
          (operationType === "insert-item" || operationType === "insert-block") &&
          (position === "before" || position === "after")
            ? `${itemId}:${position}`
            : null;

        if (anchorKey && state.insertPos === undefined) {
          const anchorPos = insertAnchors.get(anchorKey);
          if (anchorPos !== undefined) {
            state.insertPos = anchorPos;
          }
        }

        const applied = dispatchOperation({
          editor,
          state,
          operation,
          blockMap: blockMapRef.current,
          editsState: editsState.current,
        });

        if (anchorKey) {
          const anchorPos = state.insertedRange
            ? position === "after"
              ? state.insertedRange.to
              : state.insertedRange.from
            : state.insertPos;
          if (anchorPos !== undefined) {
            insertAnchors.set(anchorKey, anchorPos);
          }
        }

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
              const parsed = parsePartialEdits(buffer);
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
    [editor, processEdits]
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
