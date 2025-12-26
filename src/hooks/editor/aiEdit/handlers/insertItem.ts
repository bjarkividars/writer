import type { Editor } from "@tiptap/react";
import type { BlockItem } from "@/lib/ai/schemas";
import type { EditState } from "../types";
import {
  buildInlineInsertNodes,
  buildListItemNodes,
  findListItemRange,
  isStringArray,
  shiftRangesAfterEdit,
} from "../utils";

export function handleInsertItemOperation(args: {
  editor: Editor;
  state: EditState;
  operation: unknown;
  blockMap: BlockItem[];
  editsState: Map<number, EditState>;
}): boolean {
  const { editor, state, operation, blockMap, editsState } = args;

  if (!state.targetRange) return false;

  const position = (operation as { position?: unknown }).position;
  const itemsValue = (operation as { items?: unknown }).items;
  if ((position !== "before" && position !== "after") || !isStringArray(itemsValue)) {
    return false;
  }

  const cleanedItems = itemsValue.map((item) => item.trim()).filter(Boolean);
  if (cleanedItems.length === 0) {
    state.operationApplied = true;
    return false;
  }

  let insertPos =
    position === "before" ? state.targetRange.from : state.targetRange.to;

  const beforeSize = editor.state.doc.nodeSize;

  if (state.blockType === "bulletList" || state.blockType === "orderedList") {
    const listItemRange = findListItemRange(editor, state.targetRange.from);
    if (!listItemRange) {
      state.operationApplied = true;
      return false;
    }

    const listInsertPos =
      position === "before" ? listItemRange.from : listItemRange.to;
    insertPos = listInsertPos;
    const listItems = buildListItemNodes(cleanedItems);
    editor.chain().focus().insertContentAt(listInsertPos, listItems).run();
  } else {
    const combined = cleanedItems.join(" ");
    const { nodes } = buildInlineInsertNodes(editor, insertPos, combined);
    editor.chain().focus().insertContentAt(insertPos, nodes).run();
  }

  const afterSize = editor.state.doc.nodeSize;
  const delta = afterSize - beforeSize;
  if (delta !== 0) {
    shiftRangesAfterEdit({
      from: insertPos,
      to: insertPos,
      delta,
      nextLength: 0,
      blockMap,
      editsState,
    });
  }

  state.operationApplied = true;
  return true;
}
