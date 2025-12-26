import type { Editor } from "@tiptap/react";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { BlockItem, BlockType } from "./schemas";

export type BlockMapResult = {
  items: BlockItem[];
};

type SentenceRange = {
  text: string;
  start: number;
  end: number;
};

function isWhitespace(char: string) {
  return char === " " || char === "\n" || char === "\t" || char === "\r";
}

function splitSentences(text: string): SentenceRange[] {
  const ranges: SentenceRange[] = [];
  const length = text.length;
  let start = 0;

  while (start < length && isWhitespace(text[start])) {
    start += 1;
  }

  let i = start;
  while (i < length) {
    const char = text[i];
    const isEndPunct = char === "." || char === "!" || char === "?";

    if (isEndPunct) {
      let end = i + 1;

      if (char === ".") {
        let j = i + 1;
        while (j < length && text[j] === ".") {
          end = j + 1;
          j += 1;
        }
        i = end - 1;
      }

      if (end === length || isWhitespace(text[end])) {
        let trimmedEnd = end;
        while (trimmedEnd > start && isWhitespace(text[trimmedEnd - 1])) {
          trimmedEnd -= 1;
        }

        if (trimmedEnd > start) {
          ranges.push({
            text: text.slice(start, trimmedEnd),
            start,
            end: trimmedEnd,
          });
        }

        start = end;
        while (start < length && isWhitespace(text[start])) {
          start += 1;
        }
        i = start;
        continue;
      }
    }

    i += 1;
  }

  if (start < length) {
    let trimmedEnd = length;
    while (trimmedEnd > start && isWhitespace(text[trimmedEnd - 1])) {
      trimmedEnd -= 1;
    }

    if (trimmedEnd > start) {
      ranges.push({
        text: text.slice(start, trimmedEnd),
        start,
        end: trimmedEnd,
      });
    }
  }

  return ranges;
}

function getListItemTextRange(
  listItemNode: ProseMirrorNode,
  listItemPos: number
) {
  let textblockRange: { from: number; to: number } | null = null;

  listItemNode.forEach((child, offset) => {
    if (textblockRange || !child.isTextblock) return;
    const textblockPos = listItemPos + offset + 1;
    textblockRange = {
      from: textblockPos + 1,
      to: textblockPos + child.nodeSize - 1,
    };
  });

  if (textblockRange) return textblockRange;

  return {
    from: listItemPos + 1,
    to: listItemPos + listItemNode.nodeSize - 1,
  };
}

/**
 * Build a block + item map from the current TipTap editor state.
 */
export function buildBlockMap(editor: Editor): BlockMapResult {
  const { doc } = editor.state;
  const items: BlockItem[] = [];

  let blockNum = 0;

  doc.descendants((node, pos) => {
    if (node.type.name === "paragraph" || node.type.name === "heading") {
      if (!node.textContent.trim()) return true;

      blockNum++;
      const blockType: BlockType =
        node.type.name === "heading" ? "heading" : "paragraph";
      const headingLevel =
        node.type.name === "heading" ? node.attrs.level : undefined;
      const blockText = node.textContent;
      const sentenceRanges = splitSentences(blockText);

      if (sentenceRanges.length === 0) {
        items.push({
          id: `block-${blockNum}.1`,
          blockNum,
          itemNum: 1,
          blockType,
          headingLevel,
          from: pos + 1,
          to: pos + node.nodeSize - 1,
          text: blockText,
        });
        return true;
      }

      let searchPos = 0;
      let itemNum = 0;

      sentenceRanges.forEach((sentence) => {
        const sentStart = sentence.start;

        if (sentStart < searchPos) return;

        const sentEnd = sentence.end;
        itemNum += 1;

        items.push({
          id: `block-${blockNum}.${itemNum}`,
          blockNum,
          itemNum,
          blockType,
          headingLevel,
          from: pos + 1 + sentStart,
          to: pos + 1 + sentEnd,
          text: sentence.text,
        });

        searchPos = sentEnd;
      });

      if (itemNum === 0) {
        items.push({
          id: `block-${blockNum}.1`,
          blockNum,
          itemNum: 1,
          blockType,
          headingLevel,
          from: pos + 1,
          to: pos + node.nodeSize - 1,
          text: blockText,
        });
      }

      return true;
    }

    if (node.type.name === "bulletList" || node.type.name === "orderedList") {
      if (!node.textContent.trim()) return false;

      blockNum++;
      const blockType: BlockType =
        node.type.name === "bulletList" ? "bulletList" : "orderedList";

      let itemNum = 0;
      node.forEach((child, offset) => {
        if (child.type.name !== "listItem") return;

        itemNum += 1;
        const listItemPos = pos + 1 + offset;
        const range = getListItemTextRange(child, listItemPos);

        items.push({
          id: `block-${blockNum}.${itemNum}`,
          blockNum,
          itemNum,
          blockType,
          from: range.from,
          to: range.to,
          text: child.textContent,
        });
      });

      return false;
    }

    return true;
  });

  return { items };
}
