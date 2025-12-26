import type { Editor } from "@tiptap/react";
import type { BlockItem } from "@/lib/ai/schemas";
import type { EditState } from "../types";
import { findBlockRange, shiftRangesAfterEdit } from "../utils";

export function handleDeleteBlockOperation(args: {
  editor: Editor;
  state: EditState;
  operation: unknown;
  blockMap: BlockItem[];
  editsState: Map<number, EditState>;
}): boolean {
  const { editor, state, blockMap, editsState } = args;

  if (!state.targetRange) return false;

  const blockRange = findBlockRange(editor, state.targetRange.from);
  if (!blockRange) {
    state.operationApplied = true;
    return false;
  }

  if (state.blockNum) {
    for (let i = blockMap.length - 1; i >= 0; i -= 1) {
      if (blockMap[i].blockNum === state.blockNum) {
        blockMap.splice(i, 1);
      }
    }
  }

  const beforeSize = editor.state.doc.nodeSize;
  editor.chain().focus().deleteRange({ from: blockRange.from, to: blockRange.to }).run();
  const afterSize = editor.state.doc.nodeSize;
  const delta = afterSize - beforeSize;

  if (delta !== 0) {
    shiftRangesAfterEdit({
      from: blockRange.from,
      to: blockRange.to,
      delta,
      nextLength: 0,
      blockMap,
      editsState,
    });
  }

  state.operationApplied = true;
  return true;
}
