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

export function handleInsertBlockOperation(args: {
  editor: Editor;
  state: EditState;
  operation: unknown;
  blockMap: BlockItem[];
  editsState: Map<string, EditState>;
}): boolean {
  const { editor, state, operation, blockMap, editsState } = args;

  if (!state.targetRange) return false;

  const position = (operation as { position?: unknown }).position;
  const blockType = (operation as { blockType?: unknown }).blockType;
  const headingLevel = (operation as { headingLevel?: unknown }).headingLevel;
  const itemsValue = (operation as { items?: unknown }).items;
  const anchor = (operation as { anchor?: unknown }).anchor;
  const forceBlockAnchor = anchor === "block";

  const rawItems = isStringArray(itemsValue) ? itemsValue : [];
  const rawCombined = rawItems.join(" ");
  const splitIntoBlocks =
    (blockType === "paragraph" || blockType === "heading") &&
    hasParagraphBreak(rawCombined);

  if (
    (position !== "before" && position !== "after") ||
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
  if (insertPos === undefined) {
    let useItemAnchor = false;

    if (
      !forceBlockAnchor &&
      state.blockType === "paragraph" &&
      typeof state.itemId === "string"
    ) {
      const targetItem = blockMap.find((item) => item.id === state.itemId);
      if (targetItem && targetItem.itemNum > 1) {
        useItemAnchor = true;
      }
    }

    if (useItemAnchor) {
      insertPos =
        position === "before" ? state.targetRange.from : state.targetRange.to;
    } else {
      const blockRange = findBlockRange(editor, state.targetRange.from);
      if (!blockRange) {
        state.operationApplied = true;
        return false;
      }
      insertPos = position === "before" ? blockRange.from : blockRange.to;
    }
    state.insertPos = insertPos;
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

  insertPos = clampPos(editor.state.doc, insertPos);
  state.insertPos = insertPos;

  const deleteFrom = state.insertedRange ? state.insertedRange.from : insertPos;
  const deleteTo = state.insertedRange ? state.insertedRange.to : insertPos;
  const deleteRange = clampRange(editor.state.doc, deleteFrom, deleteTo);
  if (!deleteRange) return false;

  const beforeSize = editor.state.doc.nodeSize;
  const chain = editor.chain().focus();
  if (deleteRange.from !== deleteRange.to) {
    chain.deleteRange({ from: deleteRange.from, to: deleteRange.to });
  }
  chain.insertContentAt(insertPos, blockNodes).run();
  const afterSize = editor.state.doc.nodeSize;
  const delta = afterSize - beforeSize;
  const oldLength = deleteRange.to - deleteRange.from;
  const nextLength = oldLength + delta;

  state.itemsSeen = cleanedItems;
  state.insertedRange = { from: insertPos, to: insertPos + nextLength };

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
