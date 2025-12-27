import type { Editor } from "@tiptap/react";
import type { BlockItem } from "@/lib/ai/schemas";
import type { EditState } from "../types";
import {
  areStringArraysEqual,
  buildInlineInsertNodes,
  buildListItemNodes,
  clampPos,
  clampRange,
  findListItemRange,
  isStringArray,
  normalizeItems,
  stripHeadingMarker,
  shiftRangesAfterEdit,
} from "../utils";

export function handleInsertItemOperation(args: {
  editor: Editor;
  state: EditState;
  operation: unknown;
  blockMap: BlockItem[];
  editsState: Map<string, EditState>;
}): boolean {
  const { editor, state, operation, blockMap, editsState } = args;

  if (!state.targetRange) return false;

  const position = (operation as { position?: unknown }).position;
  const itemsValue = (operation as { items?: unknown }).items;
  if (
    (position !== "before" && position !== "after") ||
    !isStringArray(itemsValue)
  ) {
    return false;
  }

  let cleanedItems = normalizeItems(itemsValue);
  if (state.blockType === "heading") {
    cleanedItems = cleanedItems.map(stripHeadingMarker);
  }
  if (cleanedItems.length === 0) {
    return false;
  }

  if (areStringArraysEqual(state.itemsSeen, cleanedItems)) {
    return false;
  }

  let insertPos = state.insertPos;
  if (insertPos === undefined) {
    insertPos =
      position === "before" ? state.targetRange.from : state.targetRange.to;

    if (state.blockType === "bulletList" || state.blockType === "orderedList") {
      const listItemRange = findListItemRange(editor, state.targetRange.from);
      if (!listItemRange) {
        state.operationApplied = true;
        return false;
      }
      insertPos = position === "before" ? listItemRange.from : listItemRange.to;
    }

    state.insertPos = insertPos;
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

  if (state.blockType === "bulletList" || state.blockType === "orderedList") {
    const listItems = buildListItemNodes(cleanedItems);
    chain.insertContentAt(insertPos, listItems);
  } else {
    const combined = cleanedItems.join(" ");
    const { nodes } = buildInlineInsertNodes(editor, insertPos, combined);
    chain.insertContentAt(insertPos, nodes);
  }
  chain.run();

  const afterSize = editor.state.doc.nodeSize;
  const delta = afterSize - beforeSize;
  const oldLength = deleteRange.to - deleteRange.from;
  const nextLength = oldLength + delta;

  state.itemsSeen = cleanedItems;
  state.insertedRange = {
    from: insertPos,
    to: insertPos + nextLength,
  };

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
