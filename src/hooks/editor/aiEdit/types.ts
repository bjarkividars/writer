import type { Editor } from "@tiptap/react";
import type { BlockItem, BlockType } from "@/lib/ai/schemas";

export type EditState = {
  targetSeen: boolean;
  targetRange: { from: number; to: number } | null;
  blockType?: BlockType;
  headingLevel?: number;
  blockNum?: number;
  insertPos?: number;
  insertedRange: { from: number; to: number } | null;
  itemsSeen: string[];
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
  editsState: Map<string, EditState>;
  skipState?: EditState;
};

export type OperationDispatchArgs = {
  editor: Editor;
  state: EditState;
  operation: unknown;
  blockMap: BlockItem[];
  editsState: Map<string, EditState>;
};
