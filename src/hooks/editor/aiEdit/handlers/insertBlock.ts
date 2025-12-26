import type { Editor } from "@tiptap/react";
import type { BlockItem, BlockType } from "@/lib/ai/schemas";
import type { EditState } from "../types";
import {
  buildBlockNode,
  findBlockRange,
  isStringArray,
  shiftRangesAfterEdit,
} from "../utils";

export function handleInsertBlockOperation(args: {
  editor: Editor;
  state: EditState;
  operation: unknown;
  blockMap: BlockItem[];
  editsState: Map<number, EditState>;
}): boolean {
  const { editor, state, operation, blockMap, editsState } = args;

  if (!state.targetRange) return false;

  const position = (operation as { position?: unknown }).position;
  const blockType = (operation as { blockType?: unknown }).blockType;
  const headingLevel = (operation as { headingLevel?: unknown }).headingLevel;
  const itemsValue = (operation as { items?: unknown }).items;

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

  const blockRange = findBlockRange(editor, state.targetRange.from);
  if (!blockRange) {
    state.operationApplied = true;
    return false;
  }

  const insertPos = position === "before" ? blockRange.from : blockRange.to;
  const blockNode = buildBlockNode({
    blockType: blockType as BlockType,
    headingLevel: typeof headingLevel === "number" ? headingLevel : null,
    items: itemsValue,
  });

  if (!blockNode) {
    state.operationApplied = true;
    return false;
  }

  const beforeSize = editor.state.doc.nodeSize;
  editor.chain().focus().insertContentAt(insertPos, blockNode).run();
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
