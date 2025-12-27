import type { Editor } from "@tiptap/react";
import type { BlockType } from "@/lib/ai/schemas";
import { parseMarkdownToTipTap } from "@/lib/ai/markdownParser";
import type { ShiftRangesParams } from "./types";

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function normalizeItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

export function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

export function clampPos(doc: Editor["state"]["doc"], pos: number) {
  const max = doc.content.size;
  if (pos < 0) return 0;
  if (pos > max) return max;
  return pos;
}

export function clampRange(
  doc: Editor["state"]["doc"],
  from: number,
  to: number
) {
  const clampedFrom = clampPos(doc, from);
  const clampedTo = clampPos(doc, to);
  if (clampedFrom > clampedTo) return null;
  return { from: clampedFrom, to: clampedTo };
}

export function isOperationObject(
  operation: unknown
): operation is { type?: unknown } {
  return typeof operation === "object" && operation !== null;
}

export function getRequestedHeadingLevel(markdown: string): number | null {
  const match = markdown.match(/^(#{1,3})\s+/);
  return match ? match[1].length : null;
}

export function stripHeadingMarker(text: string) {
  const match = text.match(/^\s*#{1,3}\s+(.+)$/);
  return match ? match[1] : text;
}

function isWhitespace(char: string) {
  return char === " " || char === "\n" || char === "\t" || char === "\r";
}

export function getTextLength(nodes: Array<{ text: string }>) {
  return nodes.reduce((sum, node) => sum + node.text.length, 0);
}

export function shiftRangesAfterEdit(params: ShiftRangesParams) {
  const {
    from,
    to,
    delta,
    itemId,
    nextLength,
    blockMap,
    editsState,
    skipState,
  } = params;

  if (blockMap.length > 0) {
    for (let i = 0; i < blockMap.length; i += 1) {
      const item = blockMap[i];
      if (itemId && item.id === itemId) {
        blockMap[i] = {
          ...item,
          from,
          to: from + nextLength,
        };
        continue;
      }

      if (item.from >= to) {
        blockMap[i] = {
          ...item,
          from: item.from + delta,
          to: item.to + delta,
        };
        continue;
      }

      if (item.to <= from) {
        continue;
      }

      console.warn("[AI Edit] Overlapping block item range", item.id);
    }
  }

  editsState.forEach((state) => {
    if (state === skipState) return;

    if (state.targetRange) {
      if (itemId && state.itemId === itemId) {
        state.targetRange = { from, to: from + nextLength };
      } else if (state.targetRange.from >= to) {
        state.targetRange = {
          from: state.targetRange.from + delta,
          to: state.targetRange.to + delta,
        };
      } else if (state.targetRange.to <= from) {
        // No change.
      } else {
        console.warn("[AI Edit] Overlapping edit range");
      }
    }

    if (state.insertedRange) {
      if (state.insertedRange.from >= to) {
        state.insertedRange = {
          from: state.insertedRange.from + delta,
          to: state.insertedRange.to + delta,
        };
      } else if (state.insertedRange.to <= from) {
        // No change.
      } else {
        console.warn("[AI Edit] Overlapping inserted range");
      }
    }

    if (state.insertPos !== undefined) {
      if (state.insertPos >= to) {
        state.insertPos += delta;
      } else if (state.insertPos >= from && state.insertPos < to) {
        console.warn("[AI Edit] Insert position overlaps edit range");
      }
    }
  });
}

function getDocChar(doc: Editor["state"]["doc"], pos: number) {
  if (pos < 1 || pos > doc.content.size) return "";
  return doc.textBetween(pos, pos + 1, "\0", "\0");
}

export function buildInlineInsertNodes(
  editor: Editor,
  insertPos: number,
  text: string
) {
  const doc = editor.state.doc;
  const prevChar = getDocChar(doc, insertPos - 1);
  const nextChar = getDocChar(doc, insertPos);

  const needsLeadingSpace =
    prevChar !== "" && !isWhitespace(prevChar) && !isWhitespace(text[0] ?? "");
  const needsTrailingSpace =
    nextChar !== "" &&
    !isWhitespace(nextChar) &&
    !isWhitespace(text[text.length - 1] ?? "");

  const adjustedText = `${needsLeadingSpace ? " " : ""}${text}${
    needsTrailingSpace ? " " : ""
  }`;
  const nodes = parseMarkdownToTipTap(adjustedText);
  return { nodes, length: getTextLength(nodes) };
}

export function buildListItemNodes(items: string[]) {
  return items.map((item) => {
    const content = parseMarkdownToTipTap(item);
    return {
      type: "listItem",
      content: [{ type: "paragraph", content }],
    };
  });
}

export function buildBlockNode(params: {
  blockType: BlockType;
  headingLevel: number | null;
  items: string[];
}) {
  const cleanedItems = params.items
    .map((item) =>
      params.blockType === "heading" ? stripHeadingMarker(item) : item
    )
    .map((item) => item.trim())
    .filter(Boolean);
  if (cleanedItems.length === 0) return null;

  if (params.blockType === "bulletList" || params.blockType === "orderedList") {
    return {
      type: params.blockType,
      content: buildListItemNodes(cleanedItems),
    };
  }

  const combined = cleanedItems.join(" ");
  const content = parseMarkdownToTipTap(combined);

  if (params.blockType === "heading") {
    return {
      type: "heading",
      attrs: { level: params.headingLevel ?? 1 },
      content,
    };
  }

  return {
    type: "paragraph",
    content,
  };
}

export function findListItemRange(editor: Editor, pos: number) {
  const $pos = editor.state.doc.resolve(pos);
  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.type.name === "listItem") {
      return { from: $pos.before(depth), to: $pos.after(depth) };
    }
  }
  return null;
}

export function findBlockRange(editor: Editor, pos: number) {
  const $pos = editor.state.doc.resolve(pos);
  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.type.name === "bulletList" || node.type.name === "orderedList") {
      return {
        from: $pos.before(depth),
        to: $pos.after(depth),
        blockType: node.type.name as BlockType,
      };
    }
  }

  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.type.name === "paragraph" || node.type.name === "heading") {
      return {
        from: $pos.before(depth),
        to: $pos.after(depth),
        blockType: node.type.name === "heading" ? "heading" : "paragraph",
        headingLevel: node.type.name === "heading" ? node.attrs.level : undefined,
      };
    }
  }

  return null;
}
