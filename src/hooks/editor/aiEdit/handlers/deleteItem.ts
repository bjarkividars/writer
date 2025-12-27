import type { Editor } from "@tiptap/react";
import type { BlockItem } from "@/lib/ai/schemas";
import type { EditState } from "../types";
import { findListItemRange, shiftRangesAfterEdit } from "../utils";

export function handleDeleteItemOperation(args: {
  editor: Editor;
  state: EditState;
  operation: unknown;
  blockMap: BlockItem[];
  editsState: Map<string, EditState>;
}): boolean {
  const { editor, state, blockMap, editsState } = args;

  if (!state.targetRange) return false;

  let deleteFrom = state.targetRange.from;
  let deleteTo = state.targetRange.to;

  if (state.blockType === "bulletList" || state.blockType === "orderedList") {
    const listItemRange = findListItemRange(editor, state.targetRange.from);
    if (!listItemRange) {
      state.operationApplied = true;
      return false;
    }
    deleteFrom = listItemRange.from;
    deleteTo = listItemRange.to;
  }

  if (state.itemId) {
    for (let i = blockMap.length - 1; i >= 0; i -= 1) {
      if (blockMap[i].id === state.itemId) {
        blockMap.splice(i, 1);
      }
    }
  }

  const beforeSize = editor.state.doc.nodeSize;
  editor.chain().focus().deleteRange({ from: deleteFrom, to: deleteTo }).run();
  const afterSize = editor.state.doc.nodeSize;
  const delta = afterSize - beforeSize;

  if (delta !== 0) {
    shiftRangesAfterEdit({
      from: deleteFrom,
      to: deleteTo,
      delta,
      nextLength: 0,
      blockMap,
      editsState,
    });
  }

  state.operationApplied = true;
  return true;
}
