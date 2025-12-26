import type { Editor } from "@tiptap/react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Region, RegionKind } from "./schemas";

/**
 * Result of building a region map from the editor state
 */
export type RegionMapResult = {
  regions: Region[];
  allowedRange: { from: number; to: number };
  selection?: { from: number; to: number; text: string };
};

/**
 * Get the region kind from a ProseMirror node type
 */
function getRegionKind(node: ProseMirrorNode): RegionKind {
  if (node.type.name === "heading") {
    return "heading";
  }
  if (node.type.name === "paragraph") {
    return "paragraph";
  }
  if (node.type.name === "listItem") {
    return "listItem";
  }
  return "paragraph";
}

/**
 * Get a human-readable label for a region
 */
function getRegionLabel(
  kind: RegionKind,
  isCurrent: boolean,
  isPrevious: boolean,
  isNext: boolean
): string {
  if (isCurrent) {
    return kind === "heading" ? "Current heading" : "Current paragraph";
  }
  if (isPrevious) {
    return kind === "heading" ? "Previous heading" : "Previous paragraph";
  }
  if (isNext) {
    return kind === "heading" ? "Next heading" : "Next paragraph";
  }
  return "Paragraph";
}

/**
 * Build a region map from the current TipTap editor state
 *
 * This creates a structured representation of the document with stable
 * boundaries that the AI can use to target edits.
 */
export function buildRegionMap(editor: Editor): RegionMapResult {
  const { state } = editor;
  const { doc, selection } = state;
  const { from: selectionFrom, to: selectionTo, empty } = selection;

  const regions: Region[] = [];
  let currentBlockPos: number | null = null;
  let prevBlockPos: number | null = null;
  let nextBlockPos: number | null = null;

  // Find blocks around the selection/cursor
  const blocks: Array<{ pos: number; node: ProseMirrorNode }> = [];

  doc.descendants((node, pos) => {
    // Only consider block-level nodes
    if (
      node.type.name === "paragraph" ||
      node.type.name === "heading" ||
      node.type.name === "listItem"
    ) {
      blocks.push({ pos, node });
    }
    return true;
  });

  // Find the block containing the selection
  for (let i = 0; i < blocks.length; i++) {
    const { pos, node } = blocks[i];
    const blockStart = pos;
    const blockEnd = pos + node.nodeSize;

    // Check if selection is within this block
    if (selectionFrom >= blockStart && selectionFrom < blockEnd) {
      currentBlockPos = i;
      prevBlockPos = i > 0 ? i - 1 : null;
      nextBlockPos = i < blocks.length - 1 ? i + 1 : null;
      break;
    }
  }

  // If we have a selection, add it as a region
  let selectionRegion: Region | null = null;
  if (!empty && selectionFrom !== selectionTo) {
    const selectedText = state.doc.textBetween(selectionFrom, selectionTo, " ");
    selectionRegion = {
      id: "selection",
      kind: "selection",
      from: selectionFrom,
      to: selectionTo,
      text: selectedText,
      label: "Selected text",
    };
    regions.push(selectionRegion);
  }

  // Add the current block
  if (currentBlockPos !== null) {
    const { pos, node } = blocks[currentBlockPos];
    const contentFrom = pos + 1;
    const contentTo = pos + node.nodeSize - 1;

    regions.push({
      id: `block-current`,
      kind: getRegionKind(node),
      from: contentFrom,
      to: contentTo,
      text: node.textContent,
      label: getRegionLabel(getRegionKind(node), true, false, false),
    });
  }

  // Add previous block if it exists
  if (prevBlockPos !== null) {
    const { pos, node } = blocks[prevBlockPos];
    const contentFrom = pos + 1;
    const contentTo = pos + node.nodeSize - 1;

    regions.push({
      id: `block-prev`,
      kind: getRegionKind(node),
      from: contentFrom,
      to: contentTo,
      text: node.textContent,
      label: getRegionLabel(getRegionKind(node), false, true, false),
    });
  }

  // Add next block if it exists
  if (nextBlockPos !== null) {
    const { pos, node } = blocks[nextBlockPos];
    const contentFrom = pos + 1;
    const contentTo = pos + node.nodeSize - 1;

    regions.push({
      id: `block-next`,
      kind: getRegionKind(node),
      from: contentFrom,
      to: contentTo,
      text: node.textContent,
      label: getRegionLabel(getRegionKind(node), false, false, true),
    });
  }

  // Calculate the allowed range (encompassing all regions)
  const allPositions = regions.flatMap((r) => [r.from, r.to]);
  const allowedFrom = Math.min(...allPositions);
  const allowedTo = Math.max(...allPositions);

  return {
    regions,
    allowedRange: {
      from: allowedFrom,
      to: allowedTo,
    },
    selection: selectionRegion
      ? {
          from: selectionRegion.from,
          to: selectionRegion.to,
          text: selectionRegion.text,
        }
      : undefined,
  };
}

