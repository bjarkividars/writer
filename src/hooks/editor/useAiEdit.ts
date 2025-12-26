import { useRef, useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
    EditRequest,
    type Region,
} from "@/lib/ai/schemas";
import {
    buildRegionMap,
    generateDocVersion,
} from "@/lib/ai";

type AiInteractionState = "idle" | "loading" | "streaming" | "complete";

/**
 * Return type of useAiEdit hook
 */
export type UseAiEditResult = ReturnType<typeof useAiEdit>;

/**
 * Simple state tracking for a single edit during streaming
 */
type EditState = {
    targetSeen: boolean;
    targetRange: { from: number; to: number } | null;
    rangeDeleted: boolean;
    replacementSeen: string;
};

/**
 * Type guard to check if value is an array
 */
function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

/**
 * Type guard for parsed edit data
 */
function isValidEdit(value: unknown): value is { target?: unknown; replacement?: unknown } {
    return typeof value === "object" && value !== null;
}

/**
 * Type guard for edit target
 */
function hasTargetFields(target: unknown): target is {
    kind?: unknown;
    from?: unknown;
    to?: unknown;
    regionId?: unknown;
    startOffset?: unknown;
    endOffset?: unknown;
} {
    return typeof target === "object" && target !== null;
}

/**
 * Hook for AI-powered document editing with streaming
 *
 * Simplified approach: manual stream parsing, delete ranges immediately,
 * insert replacement text as it streams in incrementally.
 */
export function useAiEdit(editor: Editor | null) {
    // Store the request context for target resolution
    const requestContextRef = useRef<{
        docVersion: string;
        regions: Region[];
        allowedRange: { from: number; to: number };
    } | null>(null);

    // Simple state tracking per edit
    const editsState = useRef<Map<number, EditState>>(new Map());
    const abortControllerRef = useRef<AbortController | null>(null);

    // React state for UI
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [aiInteractionState, setAiInteractionState] = useState<AiInteractionState>("idle");
    const [hasStartedStreaming, setHasStartedStreaming] = useState(false);

    /**
     * Extract edits from partial JSON, including incomplete replacement text
     */
    const tryParsePartialJSON = useCallback((text: string): { edits?: unknown[] } | null => {
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

        // Extract partial edits using regex
        const edits: unknown[] = [];

        // Find the start of each edit
        const editMatches = text.matchAll(/\{"target":\s*(\{[^}]+\})/g);

        for (const editMatch of editMatches) {
            try {
                const targetJson = editMatch[1];
                const editStartPos = editMatch.index!;

                // Parse the target
                const target = JSON.parse(targetJson) as unknown;

                // Extract replacement text after this target
                const afterTarget = text.substring(editStartPos);
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
                    replacement,
                });
            } catch {
                // Skip invalid matches
            }
        }

        return edits.length > 0 ? { edits } : null;
    }, []);

    /**
     * Resolve edit target to absolute positions
     */
    const resolveTarget = useCallback((target: unknown): { from: number; to: number } | null => {
        if (!hasTargetFields(target)) return null;

        // Range target
        if (
            target.kind === "range" &&
            typeof target.from === "number" &&
            typeof target.to === "number"
        ) {
            return { from: target.from, to: target.to };
        }

        // Region-offset target
        if (
            target.kind === "region-offset" &&
            typeof target.regionId === "string" &&
            typeof target.startOffset === "number" &&
            typeof target.endOffset === "number"
        ) {
            const region = requestContextRef.current?.regions.find(
                (r) => r.id === target.regionId
            );
            if (!region) return null;

            return {
                from: region.from + target.startOffset,
                to: region.from + target.endOffset,
            };
        }

        return null;
    }, []);

    /**
     * Process edits incrementally as they stream in
     */
    const processEdits = useCallback((edits: unknown[]) => {
        if (!editor) return;

        let appliedAnyEdit = false;

        edits.forEach((edit, index) => {
            if (!isValidEdit(edit)) return;

            let state = editsState.current.get(index);

            // STEP 1: Delete range on first sight of valid target
            if (!state?.targetSeen && edit.target !== undefined) {
                const range = resolveTarget(edit.target);
                if (range) {
                    // Delete the range immediately
                    editor.chain().focus().deleteRange(range).run();

                    // Track it
                    editsState.current.set(index, {
                        targetSeen: true,
                        targetRange: range,
                        rangeDeleted: true,
                        replacementSeen: "",
                    });

                    state = editsState.current.get(index)!;
                    appliedAnyEdit = true;
                }
            }

            // STEP 2: Insert new replacement characters
            if (state?.rangeDeleted && typeof edit.replacement === "string") {
                const newText = edit.replacement;
                const oldText = state.replacementSeen;

                if (newText.length > oldText.length) {
                    // New characters arrived - insert them
                    const newChars = newText.slice(oldText.length);
                    const insertPos = state.targetRange!.from + oldText.length;

                    editor.chain().focus().insertContentAt(insertPos, newChars).run();

                    // Update state
                    state.replacementSeen = newText;
                    appliedAnyEdit = true;
                }
            }
        });

        // Notify streaming started on first edit
        if (appliedAnyEdit && !hasStartedStreaming) {
            setHasStartedStreaming(true);
            setAiInteractionState("streaming");
        }
    }, [editor, resolveTarget, hasStartedStreaming]);

    /**
     * Stream edits from the API
     */
    const streamEdits = useCallback(async (payload: EditRequest) => {
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

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Try to parse accumulated buffer and process edits
                const parsed = tryParsePartialJSON(buffer);
                if (parsed && parsed.edits) {
                    processEdits(parsed.edits);
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
    }, [editor, tryParsePartialJSON, processEdits]);

    /**
     * Run an AI edit based on an instruction
     */
    const run = useCallback((instruction: string) => {
        if (!editor) {
            console.error("[AI Edit] Editor not available");
            return;
        }

        try {
            // Build the request context
            const docVersion = generateDocVersion(editor.state.doc);
            const { regions, allowedRange, selection } = buildRegionMap(editor);
            const docText = editor.getText();

            // Store context for later resolution
            requestContextRef.current = {
                docVersion,
                regions,
                allowedRange,
            };

            // Build and validate payload
            const payload = EditRequest.parse({
                instruction,
                docVersion,
                selection,
                allowedRange,
                regions,
                docText,
            });

            // Start streaming
            streamEdits(payload);
        } catch (err) {
            console.error("[AI Edit] Failed to build request:", err);
            setError(err as Error);
        }
    }, [editor, streamEdits]);

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
        requestContextRef.current = null;
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
