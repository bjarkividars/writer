import type { Editor } from "@tiptap/react";
import type { BlockItem, BlockType } from "@/lib/ai/schemas";

export type EditState = {
  targetSeen: boolean;
  targetRange: { from: number; to: number } | null;
  blockType?: BlockType;
  headingLevel?: number;
  blockNum?: number;
  rangeDeleted: boolean;
  replacementSeen: string;
  replacementLength: number;
  itemId?: string;
  operationApplied: boolean;
};

export type ShiftRangesParams = {
  from: number;
  to: number;
  delta: number;
  itemId?: string;
  nextLength: number;
  blockMap: BlockItem[];
  editsState: Map<number, EditState>;
};

export type OperationDispatchArgs = {
  editor: Editor;
  state: EditState;
  operation: unknown;
  blockMap: BlockItem[];
  editsState: Map<number, EditState>;
};
