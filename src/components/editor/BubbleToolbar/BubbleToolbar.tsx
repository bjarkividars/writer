"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { useEditorContext } from "@/components/editor/EditorContext";
import AssistantInput from "@/components/editor/BubbleToolbar/AssistantInput";
import FormattingButtons from "@/components/editor/BubbleToolbar/FormattingButtons";
import { useSelectionBubbleAnchor } from "@/hooks/editor/useSelectionBubbleAnchor";
import { Popover, Toolbar, Tooltip } from "@base-ui/react";

// Snapshot ref into state to avoid reading .current during render
function useResolvedElement<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [el, setEl] = useState<T | null>(null);

  useEffect(() => {
    setEl(ref.current);
  }, [ref]);

  return el;
}

export default function BubbleToolbar() {
  const {
    editor,
    editorRootRef,
    enterAiMode,
    exitAiMode,
    isAiMode,
    submitAiInstruction,
    undoLastEdit,
    aiInteractionState,
    completedPrompt,
  } = useEditorContext();

  const [inputValue, setInputValue] = useState("");

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

  // Clear input when entering complete state
  useEffect(() => {
    if (aiInteractionState === "complete") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue("");
    }
  }, [aiInteractionState]);

  // Clear input when exiting AI mode
  useEffect(() => {
    if (!isAiMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue("");
    }
  }, [isAiMode]);

  const handleSubmit = (instruction: string) => {
    submitAiInstruction(instruction);
  };

  const handleUndo = () => {
    // Restore the prompt to the input before undoing
    if (completedPrompt) {
      setInputValue(completedPrompt.text);
    }
    undoLastEdit();
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
                className="flex flex-col items-stretch gap-1"
              >
                {aiInteractionState === "complete" && completedPrompt && (
                  <div className="flex items-center justify-between gap-2 px-2 py-1 border-b border-border">
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {completedPrompt.text}
                    </span>
                    <button
                      onClick={handleUndo}
                      className="btn-secondary btn-sm shrink-0"
                    >
                      Undo
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <AssistantInput
                    expanded={isAiMode}
                    disabled={
                      aiInteractionState === "loading" ||
                      aiInteractionState === "streaming"
                    }
                    loading={
                      aiInteractionState === "loading" ||
                      aiInteractionState === "streaming"
                    }
                    placeholder={
                      completedPrompt
                        ? "Add follow up instructions"
                        : "Ask AI to edit..."
                    }
                    value={inputValue}
                    onChange={setInputValue}
                    onFocus={() => {
                      enterAiMode();
                    }}
                    onCollapse={() => {
                      exitAiMode();
                    }}
                    onSubmit={handleSubmit}
                  />

                  <FormattingButtons
                    className="transition-all duration-150"
                    isAiMode={isAiMode}
                  />
                </div>
              </Toolbar.Root>
            </Tooltip.Provider>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
