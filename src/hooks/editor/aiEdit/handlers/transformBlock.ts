import type { Editor } from "@tiptap/react";
import type { BlockItem, BlockType } from "@/lib/ai/schemas";
import type { EditState } from "../types";
import {
  areStringArraysEqual,
  buildBlockNode,
  clampPos,
  clampRange,
  findBlockRange,
  hasParagraphBreak,
  isStringArray,
  normalizeItems,
  splitParagraphs,
  shiftRangesAfterEdit,
} from "../utils";

export function handleTransformBlockOperation(args: {
  editor: Editor;
  state: EditState;
  operation: unknown;
  blockMap: BlockItem[];
  editsState: Map<string, EditState>;
}): boolean {
  const { editor, state, operation, blockMap, editsState } = args;

  if (!state.targetRange) return false;

  const blockType = (operation as { blockType?: unknown }).blockType;
  const headingLevel = (operation as { headingLevel?: unknown }).headingLevel;
  const itemsValue = (operation as { items?: unknown }).items;

  const rawItems = isStringArray(itemsValue) ? itemsValue : [];
  const rawCombined = rawItems.join(" ");
  const splitIntoBlocks =
    (blockType === "paragraph" || blockType === "heading") &&
    hasParagraphBreak(rawCombined);

  if (
    typeof blockType !== "string" ||
    (blockType !== "paragraph" &&
      blockType !== "heading" &&
      blockType !== "bulletList" &&
      blockType !== "orderedList") ||
    !isStringArray(itemsValue)
  ) {
    return false;
  }

  const cleanedItems = splitIntoBlocks
    ? splitParagraphs(rawCombined)
    : normalizeItems(itemsValue);
  if (cleanedItems.length === 0) {
    return false;
  }

  if (areStringArraysEqual(state.itemsSeen, cleanedItems)) {
    return false;
  }

  let insertPos = state.insertPos;
  let deleteFrom: number;
  let deleteTo: number;

  if (!state.rangeDeleted) {
    const blockRange = findBlockRange(editor, state.targetRange.from);
    if (!blockRange) {
      state.operationApplied = true;
      return false;
    }

    insertPos = blockRange.from;
    deleteFrom = blockRange.from;
    deleteTo = blockRange.to;
    state.insertPos = insertPos;
  } else {
    if (insertPos === undefined) {
      return false;
    }
    deleteFrom = state.insertedRange ? state.insertedRange.from : insertPos;
    deleteTo = state.insertedRange ? state.insertedRange.to : insertPos;
  }

  const blockNodes = splitIntoBlocks && cleanedItems.length > 1
    ? [
        buildBlockNode({
          blockType: blockType as BlockType,
          headingLevel: typeof headingLevel === "number" ? headingLevel : null,
          items: [cleanedItems[0]],
        }),
        ...cleanedItems.slice(1).map((paragraph) =>
          buildBlockNode({
            blockType:
              blockType === "heading" ? "paragraph" : (blockType as BlockType),
            headingLevel: null,
            items: [paragraph],
          })
        ),
      ].filter(Boolean)
    : [
        buildBlockNode({
          blockType: blockType as BlockType,
          headingLevel: typeof headingLevel === "number" ? headingLevel : null,
          items: cleanedItems,
        }),
      ].filter(Boolean);

  if (blockNodes.length === 0) {
    return false;
  }

  const beforeSize = editor.state.doc.nodeSize;
  insertPos = clampPos(editor.state.doc, insertPos);
  state.insertPos = insertPos;
  const deleteRange = clampRange(editor.state.doc, deleteFrom, deleteTo);
  if (!deleteRange) return false;

  editor
    .chain()
    .focus()
    .deleteRange({ from: deleteRange.from, to: deleteRange.to })
    .insertContentAt(insertPos, blockNodes)
    .run();
  const afterSize = editor.state.doc.nodeSize;
  const delta = afterSize - beforeSize;
  const oldLength = deleteRange.to - deleteRange.from;
  const nextLength = oldLength + delta;

  state.rangeDeleted = true;
  state.itemsSeen = cleanedItems;
  state.insertedRange = { from: insertPos, to: insertPos + nextLength };
  state.targetRange = { from: insertPos, to: insertPos };

  if (delta !== 0) {
    shiftRangesAfterEdit({
      from: deleteRange.from,
      to: deleteRange.to,
      delta,
      nextLength: 0,
      blockMap,
      editsState,
      skipState: state,
    });
  }

  return true;
}
