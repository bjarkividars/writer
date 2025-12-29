"use client";

import type { Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import { type RefObject } from "react";
import BubbleToolbar from "@/components/editor/BubbleToolbar/BubbleToolbar";

type TipTapEditorProps = {
  editor: Editor | null;
  editorRootRef: RefObject<HTMLDivElement | null>;
};

export default function TipTapEditor({
  editor,
  editorRootRef,
}: TipTapEditorProps) {
  return (
    <div ref={editorRootRef} className="min-h-full w-full flex-1">
      <EditorContent editor={editor} className="h-full w-full" />
      <BubbleToolbar />
    </div>
  );
}
