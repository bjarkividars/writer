"use client";

import { useEditorContext } from "@/components/editor/EditorContext";
import { Button } from "@/components/Button";

export default function EditorEmptyState() {
  const { editor, isEditorEmpty, isEditorFocused } = useEditorContext();

  if (!isEditorEmpty || isEditorFocused) {
    return null;
  }

    return (
    <div className="absolute inset-0 z-10">
      <Button
        type="button"
        className="flex h-full w-full cursor-text items-center justify-center border-0 bg-transparent p-0 text-center"
        aria-label="Focus the document to start writing"
        onClick={() => editor?.commands.focus("start")}
      >
        <div className="flex max-w-lg flex-col items-center gap-2 px-6">
          <h2 className="text-xl font-semibold text-foreground">
            Start writing
          </h2>
          <p className="text-sm text-muted-foreground">
            Draft your content here. You can paste, write, or edit freely.
          </p>
        </div>
      </Button>
    </div>
  );
}
