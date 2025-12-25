"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";
import { editorExtensions } from "@/editor/extensions";

export default function Editor() {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: "<p>Start writing...</p>",
    editorProps: {
      attributes: {
        class: "outline-none text-base leading-7",
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.focus("start");
    }
  }, [editor]);

  return <EditorContent editor={editor} className="h-full" />;
}
