"use client";

import type { Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import { useEffect, type RefObject } from "react";
import BubbleToolbar from "@/components/editor/BubbleToolbar/BubbleToolbar";

type TipTapEditorProps = {
  editor: Editor | null;
  editorRootRef: RefObject<HTMLDivElement | null>;
};

export default function TipTapEditor({ editor, editorRootRef }: TipTapEditorProps) {
  useEffect(() => {
    if (editor) {
      editor.commands.focus("start");
    }
  }, [editor]);

  return (
    <div ref={editorRootRef} className="h-full w-full">
      <EditorContent editor={editor} className="h-full w-full" />
      <BubbleToolbar />
    </div>
  );
}
