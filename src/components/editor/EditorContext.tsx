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

type TextFormatValue =
  | "paragraph"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "bullet-list"
  | "ordered-list";

type EditorContextValue = {
  editor: Editor | null;
  editorRootRef: RefObject<HTMLDivElement | null>;
  textFormat: TextFormatValue;
  activeMarks: string[];
  // AI highlight
  enterAiMode: () => void;
  exitAiMode: () => void;
  isAiMode: boolean;
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
  const [textFormat, setTextFormat] = useState<TextFormatValue>("paragraph");
  const [activeMarks, setActiveMarks] = useState<string[]>([]);
  const [isAiMode, setIsAiMode] = useState(false);

  const [highlightedRange, setHighlightedRange] =
    useState<SelectionRange>(null);
  const [selectedText, setSelectedText] = useState("");

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
  }, [editor, highlightedRange]);

  const value = useMemo<EditorContextValue>(
    () => ({
      editor,
      editorRootRef,
      textFormat,
      activeMarks,
      enterAiMode,
      exitAiMode,
      isAiMode,
      selectedText,
    }),
    [
      editor,
      editorRootRef,
      textFormat,
      activeMarks,
      enterAiMode,
      exitAiMode,
      isAiMode,
      selectedText,
    ]
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}
