import type { Editor } from "@tiptap/react";
import type { BlockItem } from "@/lib/ai/schemas";
import {
  isMarkdownComplete,
  parseMarkdownForBlock,
  parseMarkdownToTipTap,
} from "@/lib/ai/markdownParser";
import type { EditState } from "../types";
import {
  getRequestedHeadingLevel,
  getTextLength,
  shiftRangesAfterEdit,
} from "../utils";

export function handleReplaceOperation(args: {
  editor: Editor;
  state: EditState;
  operation: unknown;
  blockMap: BlockItem[];
  editsState: Map<number, EditState>;
}): boolean {
  const { editor, state, operation, blockMap, editsState } = args;

  if (!state.targetRange) return false;

  const newText =
    typeof (operation as { replacement?: unknown }).replacement === "string"
      ? (operation as { replacement?: unknown }).replacement
      : "";
  const oldText = state.replacementSeen;

  if (newText === oldText || typeof newText !== "string") return false;
  if (!isMarkdownComplete(newText)) return false;

  const textNodes = state.blockType
    ? parseMarkdownForBlock(newText, state.blockType, state.headingLevel)
    : parseMarkdownToTipTap(newText);
  const nextReplacementLength = getTextLength(textNodes);

  const requestedHeadingLevel =
    state.blockType === "heading" ? getRequestedHeadingLevel(newText) : null;

  const insertPos = state.targetRange.from;
  const deleteFrom = insertPos;
  const deleteTo = state.rangeDeleted
    ? insertPos + state.replacementLength
    : state.targetRange.to;

  const deletedLength = deleteTo - deleteFrom;
  const delta = nextReplacementLength - deletedLength;

  const chain = editor.chain().focus();
  if (
    state.blockType === "heading" &&
    requestedHeadingLevel &&
    requestedHeadingLevel >= 1 &&
    requestedHeadingLevel <= 3
  ) {
    chain
      .setTextSelection({ from: state.targetRange.from, to: state.targetRange.to })
      .setNode("heading", { level: requestedHeadingLevel });
    state.headingLevel = requestedHeadingLevel;
  }

  chain
    .deleteRange({ from: deleteFrom, to: deleteTo })
    .insertContentAt(insertPos, textNodes)
    .run();

  state.rangeDeleted = true;
  state.replacementSeen = newText;
  state.replacementLength = nextReplacementLength;

  if (delta !== 0 || state.itemId) {
    shiftRangesAfterEdit({
      from: deleteFrom,
      to: deleteTo,
      delta,
      itemId: state.itemId,
      nextLength: nextReplacementLength,
      blockMap,
      editsState,
    });
  }

  return true;
}
