"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import { EditorProvider } from "@/components/editor/EditorContext";
import BubbleToolbar from "@/components/editor/BubbleToolbar/BubbleToolbar";
import { editorExtensions } from "@/editor/extensions";

export default function TipTapEditor() {
  const editorRootRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-full w-full outline-none text-base leading-7",
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.focus("start");
    }
  }, [editor]);

  return (
    <EditorProvider editor={editor} editorRootRef={editorRootRef}>
      <div ref={editorRootRef} className="h-full w-full">
        <EditorContent editor={editor} className="h-full w-full" />
        <BubbleToolbar />
      </div>
    </EditorProvider>
  );
}
