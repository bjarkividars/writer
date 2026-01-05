import type { Editor } from "@tiptap/react";
import type { BlockItem } from "@/lib/ai/schemas";
import {
  isMarkdownComplete,
  parseMarkdownForBlock,
  parseMarkdownToTipTap,
} from "@/lib/ai/markdownParser";
import type { EditState } from "../types";
import {
  buildBlockNode,
  clampPos,
  clampRange,
  findBlockRange,
  getRequestedHeadingLevel,
  getTextLength,
  hasParagraphBreak,
  sanitizeInlineText,
  splitParagraphs,
  shiftRangesAfterEdit,
} from "../utils";

export function handleReplaceOperation(args: {
  editor: Editor;
  state: EditState;
  operation: unknown;
  blockMap: BlockItem[];
  editsState: Map<string, EditState>;
}): boolean {
  const { editor, state, operation, blockMap, editsState } = args;

  if (!state.targetRange) return false;

  const rawReplacement =
    typeof (operation as { replacement?: unknown }).replacement === "string"
      ? (operation as { replacement?: unknown }).replacement as string
      : ""
  const canSplitIntoBlocks =
    state.blockType === "paragraph" || state.blockType === "heading";
  const paragraphs = canSplitIntoBlocks && hasParagraphBreak(rawReplacement)
    ? splitParagraphs(rawReplacement)
    : [];
  const primaryParagraph = paragraphs[0] ?? rawReplacement;
  const newText = sanitizeInlineText(primaryParagraph);
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

  const extraParagraphs = paragraphs.slice(1);
  if (extraParagraphs.length > 0 || state.insertedRange) {
    const blockRange = findBlockRange(editor, state.targetRange.from);
    const baseInsertPos = state.insertedRange
      ? state.insertedRange.from
      : blockRange?.to ?? state.targetRange.to;
    const insertPos = clampPos(editor.state.doc, baseInsertPos);
    const deleteFrom = state.insertedRange?.from ?? insertPos;
    const deleteTo = state.insertedRange?.to ?? insertPos;
    const deleteRange = clampRange(editor.state.doc, deleteFrom, deleteTo);
    if (!deleteRange) return true;

    const extraBlockType =
      state.blockType === "heading" ? "paragraph" : state.blockType ?? "paragraph";
    const extraBlocks = extraParagraphs
      .map((paragraph) =>
        buildBlockNode({
          blockType: extraBlockType,
          headingLevel: null,
          items: [paragraph],
        })
      )
      .filter(Boolean);

    const beforeSize = editor.state.doc.nodeSize;
    const chain = editor.chain().focus();
    if (deleteRange.from !== deleteRange.to) {
      chain.deleteRange({ from: deleteRange.from, to: deleteRange.to });
    }
    if (extraBlocks.length > 0) {
      chain.insertContentAt(insertPos, extraBlocks);
    }
    chain.run();
    const afterSize = editor.state.doc.nodeSize;
    const delta = afterSize - beforeSize;
    const oldLength = deleteRange.to - deleteRange.from;
    const nextLength = oldLength + delta;

    if (delta !== 0 || oldLength !== 0) {
      shiftRangesAfterEdit({
        from: deleteRange.from,
        to: deleteRange.to,
        delta,
        nextLength: 0,
        blockMap,
        editsState,
      });
    }

    state.insertedRange =
      extraBlocks.length > 0
        ? { from: insertPos, to: insertPos + nextLength }
        : null;
  }

  return true;
}
