"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useMemo,
  RefObject,
  ReactNode,
} from "react";
import type { Editor, JSONContent } from "@tiptap/react";
import { useAiEdit } from "@/hooks/editor/useAiEdit";
import { useDocumentAutosave } from "@/hooks/editor/useDocumentAutosave";
import { useChatContext } from "@/components/chat/ChatContext";
import type { AiEditOption } from "@/lib/ai/schemas";
import { useSessionContext } from "@/components/session/SessionContext";

type SelectionRange = { from: number; to: number } | null;

type TextFormatValue =
  | "paragraph"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "bullet-list"
  | "ordered-list";

type CompletedPrompt = {
  text: string;
  timestamp: number;
};

type AiEditMode = "inline" | "chat";

type AiInstructionOptions = {
  mode?: AiEditMode;
  sessionId?: string;
  onMessageUpdate?: (message: string) => void;
  onMessageComplete?: (message: string) => void;
  onOptionsUpdate?: (options: AiEditOption[]) => void;
  onOptionsComplete?: (options: AiEditOption[]) => void;
};

type UndoState = {
  doc: JSONContent;
  selection: { from: number; to: number };
  highlightedRange: SelectionRange;
  selectedText: string;
} | null;

type EditorContextValue = {
  editor: Editor | null;
  editorRootRef: RefObject<HTMLDivElement | null>;
  textFormat: TextFormatValue;
  activeMarks: string[];
  isEditorEmpty: boolean;
  isEditorFocused: boolean;
  // AI highlight (for visual selection when input is focused)
  enterAiMode: () => void;
  exitAiMode: () => void;
  isAiMode: boolean;
  selectedText: string;
  // AI editing
  submitAiInstruction: (instruction: string, options?: AiInstructionOptions) => void;
  undoLastEdit: () => void;
  aiInteractionState: "idle" | "loading" | "streaming" | "editing" | "complete";
  lastAiMode: AiEditMode;
  completedPrompt: CompletedPrompt | null;
  aiEditError: unknown;
  resetAiEdit: () => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);
const TITLE_DOC_THRESHOLD = 300;

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorContext must be used within EditorProvider");
  }
  return context;
}

type EditorProviderProps = {
  editor: Editor | null;
  editorRootRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
};

export function EditorProvider({
  editor,
  editorRootRef,
  children,
}: EditorProviderProps) {
  // Track formatting states with React state to trigger re-renders
  const [textFormat, setTextFormat] = useState<TextFormatValue>("paragraph");
  const [activeMarks, setActiveMarks] = useState<string[]>([]);
  const [isAiMode, setIsAiMode] = useState(false);
  const [lastAiMode, setLastAiMode] = useState<AiEditMode>("inline");
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  const [highlightedRange, setHighlightedRange] =
    useState<SelectionRange>(null);
  const [selectedText, setSelectedText] = useState("");

  // AI interaction state
  const [completedPrompt, setCompletedPrompt] =
    useState<CompletedPrompt | null>(null);
  const [undoState, setUndoState] = useState<UndoState>(null);

  // AI editing hook
  const aiEdit = useAiEdit(editor);
  const chat = useChatContext();
  const { ensureSession, requestTitle, title } = useSessionContext();

  useDocumentAutosave(editor, ensureSession, undefined, (_, __, text) => {
    if (title || text.trim().length < TITLE_DOC_THRESHOLD) {
      return;
    }
    void requestTitle();
  });

  useEffect(() => {
    if (!editor) return;

    const updateEmptyState = () => {
      setIsEditorEmpty(editor.isEmpty);
    };

    updateEmptyState();
    editor.on("update", updateEmptyState);
    editor.on("create", updateEmptyState);

    return () => {
      editor.off("update", updateEmptyState);
      editor.off("create", updateEmptyState);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const updateFocusState = () => {
      setIsEditorFocused(editor.isFocused);
    };

    updateFocusState();
    editor.on("focus", updateFocusState);
    editor.on("blur", updateFocusState);

    return () => {
      editor.off("focus", updateFocusState);
      editor.off("blur", updateFocusState);
    };
  }, [editor]);

  // Update formatting states when selection changes
  useEffect(() => {
    if (!editor) return;

    const updateStates = () => {
      const nextMarks: string[] = [];
      if (editor.isActive("bold")) {
        nextMarks.push("bold");
      }
      if (editor.isActive("italic")) {
        nextMarks.push("italic");
      }
      if (editor.isActive("underline")) {
        nextMarks.push("underline");
      }
      setActiveMarks(nextMarks);

      if (editor.isActive("heading", { level: 1 })) {
        setTextFormat("heading-1");
        return;
      }
      if (editor.isActive("heading", { level: 2 })) {
        setTextFormat("heading-2");
        return;
      }
      if (editor.isActive("heading", { level: 3 })) {
        setTextFormat("heading-3");
        return;
      }
      if (editor.isActive("bulletList")) {
        setTextFormat("bullet-list");
        return;
      }
      if (editor.isActive("orderedList")) {
        setTextFormat("ordered-list");
        return;
      }

      setTextFormat("paragraph");
    };

    // Initial update
    updateStates();

    // Subscribe to selection and content changes
    editor.on("selectionUpdate", updateStates);
    editor.on("transaction", updateStates);

    return () => {
      editor.off("selectionUpdate", updateStates);
      editor.off("transaction", updateStates);
    };
  }, [editor]);

  // Remove highlight when streaming starts or on error/completion
  useEffect(() => {
    if (
      (aiEdit.aiInteractionState === "streaming" ||
        aiEdit.aiInteractionState === "editing" ||
        aiEdit.aiInteractionState === "complete") &&
      editor
    ) {
      console.log(
        "[EditorContext] Removing highlights, state:",
        aiEdit.aiInteractionState
      );

      // Remove all aiHighlight marks from the entire document
      const doc = editor.state.doc;
      editor
        .chain()
        .command(({ tr, dispatch }) => {
          if (!dispatch) return true;

          // Remove marks from entire document
          doc.descendants((node, pos) => {
            if (node.marks.some((mark) => mark.type.name === "aiHighlight")) {
              const from = pos;
              const to = pos + node.nodeSize;
              tr.removeMark(from, to, editor.schema.marks.aiHighlight);
            }
          });

          return true;
        })
        .run();

      // Clear the highlighted range tracking
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedRange(null);

      console.log("[EditorContext] Highlights removed");
    }
  }, [aiEdit.aiInteractionState, editor]);

  // Enter AI mode: capture selection and apply highlight mark
  const enterAiMode = useCallback(() => {
    if (!editor) return;
    setIsAiMode(true);
    const { from, to } = editor.state.selection;
    if (from === to) return; // No selection

    // Store the range and selected text
    setHighlightedRange({ from, to });
    setSelectedText(editor.state.doc.textBetween(from, to, " "));

    // Apply the highlight mark
    editor.chain().setTextSelection({ from, to }).setMark("aiHighlight").run();
  }, [editor]);

  // Exit AI mode: remove highlight mark
  const exitAiMode = useCallback(() => {
    setIsAiMode(false);

    // Clear AI interaction state
    editor?.commands.focus();
    aiEdit.reset();
    setCompletedPrompt(null);
    setUndoState(null);

    if (!editor || !highlightedRange) {
      setHighlightedRange(null);
      setSelectedText("");
      return;
    }

    // Remove all aiHighlight marks from the entire document
    editor.chain().selectAll().unsetMark("aiHighlight").run();

    // Restore the original selection if we have it
    if (highlightedRange) {
      editor.chain().setTextSelection(highlightedRange).focus().run();
    }

    setHighlightedRange(null);
    setSelectedText("");
  }, [editor, highlightedRange, aiEdit]);

  // Submit AI instruction: store undo state and start edit
  const submitAiInstruction = useCallback(
    (instruction: string, options?: AiInstructionOptions) => {
      if (!editor) return;

      setLastAiMode(options?.mode ?? "inline");

      // Store undo state BEFORE running edit
      const { from, to } = editor.state.selection;
      setUndoState({
        doc: editor.state.doc.toJSON(),
        selection: { from, to },
        highlightedRange,
        selectedText,
      });

      // Store the instruction for history (inline only)
      if (options?.mode === "chat") {
        setCompletedPrompt(null);
      } else {
        setCompletedPrompt({
          text: instruction,
          timestamp: Date.now(),
        });
      }

      // Update highlight with loading attribute to show shimmer effect
      if (highlightedRange) {
        editor
          .chain()
          .setTextSelection(highlightedRange)
          .setMark("aiHighlight", { loading: true })
          .run();
      }

      let inlineMessageId: string | null = null;
      const handleMessageUpdate =
        options?.onMessageUpdate ??
        ((message: string) => {
          if (!message.trim()) return;
          if (!inlineMessageId) {
            inlineMessageId = chat.startModelMessage("");
          }
          chat.setMessageContent(inlineMessageId, message);
        });

      const handleMessageComplete =
        options?.onMessageComplete ??
        ((message: string) => {
          if (!inlineMessageId) return;
          chat.setMessageContent(inlineMessageId, message);
          chat.finishMessage(inlineMessageId);
        });

      const handleOptionsUpdate =
        options?.onOptionsUpdate ??
        ((nextOptions) => {
          if (!inlineMessageId) {
            inlineMessageId = chat.startModelMessage("");
          }
          chat.setMessageOptions(
            inlineMessageId,
            nextOptions.map((option, index) => ({
              index,
              title: option.title,
              content: option.content,
            }))
          );
        });

      const handleOptionsComplete =
        options?.onOptionsComplete ??
        ((nextOptions) => {
          if (!inlineMessageId) return;
          chat.setMessageOptions(
            inlineMessageId,
            nextOptions.map((option, index) => ({
              index,
              title: option.title,
              content: option.content,
            }))
          );
        });

      const sessionPromise = options?.sessionId
        ? Promise.resolve(options.sessionId)
        : ensureSession();

      void sessionPromise
        .then((sessionId) => {
          // Start the edit (useAiEdit will handle state transitions)
          aiEdit.run(instruction, {
            mode: options?.mode ?? "inline",
            sessionId,
            onMessageUpdate: handleMessageUpdate,
            onMessageComplete: handleMessageComplete,
            onOptionsUpdate: handleOptionsUpdate,
            onOptionsComplete: handleOptionsComplete,
          });
        })
        .catch((err) => {
          console.error("[EditorContext] Failed to ensure session:", err);
        });
    },
    [editor, aiEdit, highlightedRange, selectedText, chat, ensureSession]
  );

  // Undo last edit: restore original text
  const undoLastEdit = useCallback(() => {
    if (!editor || !undoState) return;

    aiEdit.stop();

    // Restore the full document snapshot
    editor.commands.setContent(undoState.doc, { emitUpdate: true });

    // Restore selection + highlight state
    editor.commands.setTextSelection(undoState.selection);
    if (undoState.highlightedRange) {
      editor
        .chain()
        .setTextSelection(undoState.highlightedRange)
        .setMark("aiHighlight", { loading: false })
        .run();
      editor.commands.setTextSelection(undoState.selection);
    }

    setHighlightedRange(undoState.highlightedRange);
    setSelectedText(undoState.selectedText);

    // Clear state
    setUndoState(null);
    setCompletedPrompt(null);
    aiEdit.reset();
  }, [editor, undoState, aiEdit]);

  const value = useMemo<EditorContextValue>(
    () => ({
      editor,
      editorRootRef,
      textFormat,
      activeMarks,
      isEditorEmpty,
      isEditorFocused,
      enterAiMode,
      exitAiMode,
      isAiMode,
      selectedText,
      // AI editing
      submitAiInstruction,
      undoLastEdit,
      aiInteractionState: aiEdit.aiInteractionState,
      lastAiMode,
      completedPrompt,
      aiEditError: aiEdit.error,
      resetAiEdit: aiEdit.reset,
    }),
    [
      editor,
      editorRootRef,
      textFormat,
      activeMarks,
      isEditorEmpty,
      isEditorFocused,
      enterAiMode,
      exitAiMode,
      isAiMode,
      selectedText,
      submitAiInstruction,
      undoLastEdit,
      aiEdit.aiInteractionState,
      lastAiMode,
      completedPrompt,
      aiEdit.error,
      aiEdit.reset,
    ]
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}
