"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { MoreVertical } from "lucide-react";
import { useEditorContext } from "@/components/editor/EditorContext";
import AssistantInput from "@/components/editor/BubbleToolbar/AssistantInput";
import FormattingButtons from "@/components/editor/BubbleToolbar/FormattingButtons";
import { useSelectionBubbleAnchor } from "@/hooks/editor/useSelectionBubbleAnchor";
import { Popover, Separator, Toolbar, Tooltip } from "@base-ui/react";

// Snapshot ref into state to avoid reading .current during render
function useResolvedElement<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [el, setEl] = useState<T | null>(null);

  useEffect(() => {
    setEl(ref.current);
  }, [ref]);

  return el;
}

export default function BubbleToolbar() {
  const { editor, editorRootRef, enterAiMode, exitAiMode, isAiMode } = useEditorContext();

  const { open, anchorRef, popoverRef, close } = useSelectionBubbleAnchor({
    editor,
    editorRootRef,
  });

  // Resolve the ref into state for use in render
  const boundaryEl = useResolvedElement(editorRootRef);

  // Ensure AI mode is always exited when bubble closes
  useEffect(() => {
    if (!open && isAiMode) {
      exitAiMode();
    }
  }, [open, isAiMode, exitAiMode]);

  const handleSubmit = (query: string) => {
    console.log("AI Query:", query);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      exitAiMode();
      close();
    }
  };
  

  if (!editor) return null;

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <span
        ref={anchorRef}
        className="pointer-events-none fixed w-0"
        aria-hidden
      />
      <Popover.Portal>
        <Popover.Positioner
          anchor={anchorRef}
          side="top"
          align="center"
          sideOffset={12}
          collisionPadding={16}
          collisionBoundary={boundaryEl ?? undefined}
        >
          <Popover.Popup
            ref={popoverRef}
            initialFocus={false}
            tabIndex={-1}
            onMouseDown={(e) => {
              // Allow focus for inputs, prevent for everything else
              const target = e.target as HTMLElement;
              const isInput =
                target.tagName === "TEXTAREA" ||
                target.tagName === "INPUT" ||
                target.closest("textarea") ||
                target.closest("input");

              if (!isInput) {
                e.preventDefault();
              }
            }}
            className="flex items-center gap-1 rounded-md border border-border bg-background px-1 py-0.5 shadow-bubble"
          >
            <Tooltip.Provider>
              <Toolbar.Root
                orientation="horizontal"
                className="flex items-center gap-1"
              >
                <AssistantInput
                  expanded={isAiMode}
                  onFocus={() => {
                    enterAiMode();
                  }}
                  onCollapse={() => {
                    exitAiMode();
                  }}
                  onSubmit={handleSubmit}
                />

                {!isAiMode && (
                  <>
                    <Separator
                      orientation="vertical"
                      className="h-4 w-px bg-border opacity-50"
                    />
                    <FormattingButtons className="transition-all duration-150" />
                  </>
                )}

                {isAiMode && (
                  <div className="self-end">
                    <button
                      type="button"
                      onClick={() => {
                        exitAiMode();
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      className="flex h-6 w-6 items-center justify-center rounded text-foreground opacity-50 transition-all duration-150 hover:opacity-100 hover:bg-hover mb-1"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </Toolbar.Root>
            </Tooltip.Provider>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
