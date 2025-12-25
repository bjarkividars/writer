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
import type { Editor } from "@tiptap/react";

type SelectionRange = { from: number; to: number } | null;

type EditorContextValue = {
  editor: Editor | null;
  editorRootRef: RefObject<HTMLDivElement | null>;
  // Formatting states
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  // Actions
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  // AI highlight
  isAiMode: boolean;
  enterAiMode: () => void;
  exitAiMode: () => void;
  selectedText: string;
};

const EditorContext = createContext<EditorContextValue | null>(null);

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
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);

  const [highlightedRange, setHighlightedRange] =
    useState<SelectionRange>(null);
  const [selectedText, setSelectedText] = useState("");

  // Update formatting states when selection changes
  useEffect(() => {
    if (!editor) return;

    const updateStates = () => {
      setIsBold(editor.isActive("bold"));
      setIsItalic(editor.isActive("italic"));
      setIsUnderline(editor.isActive("underline"));
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

  const toggleBold = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleUnderline().run();
  }, [editor]);

  // Enter AI mode: capture selection and apply highlight mark
  const enterAiMode = useCallback(() => {
    setIsAiMode(true);
    if (!editor) return;

    const { from, to } = editor.state.selection;
    if (from === to) return; // No selection

    // Store the range and selected text
    setHighlightedRange({ from, to });
    setSelectedText(editor.state.doc.textBetween(from, to, " "));

    // Apply the highlight mark
    editor.chain().setTextSelection({ from, to }).setMark("aiHighlight").run();
  }, [editor]);

  // Exit AI mode: remove ALL highlight marks from the document
  const exitAiMode = useCallback(() => {
    setIsAiMode(false);

    if (!editor) {
      setHighlightedRange(null);
      setSelectedText("");
      return;
    }

    // Remove all aiHighlight marks from the entire document
    editor
      .chain()
      .selectAll()
      .unsetMark("aiHighlight")
      .run();

    // Restore the original selection if we have it
    if (highlightedRange) {
      editor.chain().setTextSelection(highlightedRange).focus().run();
    }

    setHighlightedRange(null);
    setSelectedText("");
  }, [editor, highlightedRange]);

  const value = useMemo<EditorContextValue>(
    () => ({
      editor,
      editorRootRef,
      isBold,
      isItalic,
      isUnderline,
      toggleBold,
      toggleItalic,
      toggleUnderline,
      isAiMode,
      enterAiMode,
      exitAiMode,
      selectedText,
    }),
    [
      editor,
      editorRootRef,
      isBold,
      isItalic,
      isUnderline,
      toggleBold,
      toggleItalic,
      toggleUnderline,
      isAiMode,
      enterAiMode,
      exitAiMode,
      selectedText,
    ]
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}
