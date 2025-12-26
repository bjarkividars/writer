import { useState, useRef, useEffect, useCallback, RefObject } from "react";
import type { Editor } from "@tiptap/react";
import { getSelectionRect } from "@/lib/editor/selectionRect";

type UseSelectionBubbleAnchorArgs = {
  editor: Editor | null;
  editorRootRef: RefObject<HTMLElement | null>;
};

type UseSelectionBubbleAnchorResult = {
  open: boolean;
  anchorRef: RefObject<HTMLSpanElement | null>;
  popoverRef: RefObject<HTMLDivElement | null>;
  close: () => void;
};

export function useSelectionBubbleAnchor(
  args: UseSelectionBubbleAnchorArgs
): UseSelectionBubbleAnchorResult {
  const { editor, editorRootRef } = args;
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const editorRef = useRef(editor);
  const rafRef = useRef<number | null>(null);
  const isMouseDownRef = useRef(false);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Check if focus is currently inside the popover
  const isFocusInPopover = useCallback(() => {
    const popover = popoverRef.current;
    const activeEl = document.activeElement;
    return popover && activeEl && popover.contains(activeEl);
  }, []);

  // Check if a node is inside the editor
  const isInsideEditor = useCallback(
    (node: Node | null) => {
      const root = editorRootRef.current;
      return root && node && root.contains(node);
    },
    [editorRootRef]
  );

  const updatePosition = useCallback(() => {
    const anchorEl = anchorRef.current;
    const rect = getSelectionRect();

    if (anchorEl && rect && rect.width > 0) {
      // Position anchor at center-top of selection
      anchorEl.style.left = `${rect.left + rect.width / 2}px`;
      anchorEl.style.top = `${rect.top}px`;
      // Set height so popover knows the full selection bounds for collision detection
      anchorEl.style.height = `${rect.height}px`;
      return true;
    }
    return false;
  }, []);

  const checkSelection = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const currentEditor = editorRef.current;
      const root = editorRootRef.current;

      if (!currentEditor || !root) {
        setOpen(false);
        return;
      }

      // Don't update while mouse is down (user is still selecting)
      if (isMouseDownRef.current) {
        return;
      }

      // Don't close/update if focus is in the popover (e.g., AI input)
      if (isFocusInPopover()) {
        return;
      }

      const selection = window.getSelection();
      if (
        !selection ||
        selection.rangeCount === 0 ||
        !isInsideEditor(selection.anchorNode) ||
        !isInsideEditor(selection.focusNode)
      ) {
        return;
      }

      const { from, to, empty } = currentEditor.state.selection;

      if (empty || from === to) {
        setOpen(false);
        return;
      }

      const $from = currentEditor.state.doc.resolve(from);
      const $to = currentEditor.state.doc.resolve(to);

      if ($from.depth < 1 || $to.depth < 1) {
        setOpen(false);
        return;
      }

      if (updatePosition()) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    });
  }, [editorRootRef, updatePosition, isFocusInPopover, isInsideEditor]);

  const close = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setOpen(false);
  }, []);

  // Subscribe to editor events
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      // Only process selection updates if focus is in the editor
      if (isFocusInPopover()) {
        return;
      }
      checkSelection();
    };

    editor.on("selectionUpdate", handleSelectionUpdate);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [editor, checkSelection, isFocusInPopover]);

  // Track mouse state to avoid showing bubble during selection drag
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const popover = popoverRef.current;

      // Don't do anything if clicking inside the popover
      if (popover && popover.contains(target)) {
        return;
      }

      // Only track mouse down if it's in the editor
      if (isInsideEditor(target)) {
        isMouseDownRef.current = true;
        setOpen(false);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as Node;
      const popover = popoverRef.current;

      // Don't check selection if mouseup is in the popover
      if (popover && popover.contains(target)) {
        isMouseDownRef.current = false;
        return;
      }

      // Only check selection if the mouseup is in the editor
      if (isInsideEditor(target)) {
        isMouseDownRef.current = false;
        setTimeout(checkSelection, 50);
      } else {
        isMouseDownRef.current = false;
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [checkSelection, isInsideEditor]);

  // Update position on scroll/resize when open
  useEffect(() => {
    if (!open) return;

    const handlePositionUpdate = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handlePositionUpdate, true);
    window.addEventListener("resize", handlePositionUpdate);

    return () => {
      window.removeEventListener("scroll", handlePositionUpdate, true);
      window.removeEventListener("resize", handlePositionUpdate);
    };
  }, [open, updatePosition]);

  return { open, anchorRef, popoverRef, close };
}
