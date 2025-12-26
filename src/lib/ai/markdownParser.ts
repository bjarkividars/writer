/**
 * Markdown to TipTap Parser
 *
 * Converts markdown syntax to TipTap JSON nodes for rich text editing.
 * Supports: bold, italic, strikethrough, code, headings, bullet lists, ordered lists.
 */
import type { BlockType } from "./schemas";

type Mark = {
  type: "bold" | "italic" | "strike" | "code";
};

type TextNode = {
  type: "text";
  text: string;
  marks?: Mark[];
};

type ParagraphNode = {
  type: "paragraph";
  content?: TextNode[];
};

type HeadingNode = {
  type: "heading";
  attrs: { level: number };
  content?: TextNode[];
};

type ListItemNode = {
  type: "listItem";
  content: ParagraphNode[];
};

type BulletListNode = {
  type: "bulletList";
  content: ListItemNode[];
};

type OrderedListNode = {
  type: "orderedList";
  content: ListItemNode[];
};

export type TipTapNode =
  | TextNode
  | ParagraphNode
  | HeadingNode
  | BulletListNode
  | OrderedListNode;

/**
 * Parse inline markdown marks (bold, italic, etc.) from text
 */
function parseInlineMarks(text: string): TextNode[] {
  const nodes: TextNode[] = [];
  let currentPos = 0;

  // Pattern for inline marks: **bold**, *italic*, ~~strike~~, `code`
  const markPatterns = [
    { regex: /\*\*(.+?)\*\*/g, mark: "bold" as const },
    { regex: /\*(.+?)\*/g, mark: "italic" as const },
    { regex: /~~(.+?)~~/g, mark: "strike" as const },
    { regex: /`(.+?)`/g, mark: "code" as const },
  ];

  // Find all mark positions
  type MarkMatch = {
    start: number;
    end: number;
    mark: Mark["type"];
    text: string;
  };
  const matches: MarkMatch[] = [];

  for (const { regex, mark } of markPatterns) {
    let match;
    const re = new RegExp(regex.source, regex.flags);
    while ((match = re.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        mark,
        text: match[1],
      });
    }
  }

  // Sort matches by position, then by length (longer matches first to prioritize ** over *)
  matches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start); // Longer matches first
  });

  // Remove overlapping matches (keep first/longer match)
  const filteredMatches: MarkMatch[] = [];
  for (const match of matches) {
    const overlaps = filteredMatches.some(
      (existing) =>
        (match.start >= existing.start && match.start < existing.end) ||
        (match.end > existing.start && match.end <= existing.end) ||
        (match.start <= existing.start && match.end >= existing.end)
    );
    if (!overlaps) {
      filteredMatches.push(match);
    }
  }

  // Build text nodes with marks
  for (const match of filteredMatches) {
    // Add plain text before this mark
    if (currentPos < match.start) {
      const plainText = text.slice(currentPos, match.start);
      if (plainText) {
        nodes.push({ type: "text", text: plainText });
      }
    }

    // Add marked text
    nodes.push({
      type: "text",
      text: match.text,
      marks: [{ type: match.mark }],
    });

    currentPos = match.end;
  }

  // Add remaining plain text
  if (currentPos < text.length) {
    const plainText = text.slice(currentPos);
    if (plainText) {
      nodes.push({ type: "text", text: plainText });
    }
  }

  // If no marks found, return single text node
  if (nodes.length === 0) {
    return [{ type: "text", text }];
  }

  return nodes;
}


/**
 * Parse markdown to inline text nodes with marks
 * (no block structures like paragraphs, headings, lists)
 */
export function parseMarkdownToTipTap(markdown: string): TextNode[] {
  if (!markdown.trim()) {
    return [{ type: "text", text: "" }];
  }

  // Parse inline marks only (bold, italic, code, strikethrough)
  return parseInlineMarks(markdown);
}

/**
 * Parse markdown replacement based on original block type
 */
export function parseMarkdownForBlock(
  markdown: string,
  blockType: BlockType,
  _headingLevel?: number
): TextNode[] {
  if (!markdown.trim()) {
    return [{ type: "text", text: "" }];
  }

  if (blockType === "heading") {
    const headingMatch = markdown.match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch) {
      return parseInlineMarks(headingMatch[2]);
    }

    console.warn("[Parser] Heading missing # marker");
    return parseInlineMarks(markdown);
  }

  return parseInlineMarks(markdown);
}

/**
 * Check if markdown syntax is complete (for streaming)
 */
export function isMarkdownComplete(markdown: string): boolean {
  // Check for unclosed inline marks
  const openBold = (markdown.match(/\*\*/g) || []).length;
  if (openBold % 2 !== 0) return false;

  const openItalic = (markdown.match(/(?<!\*)\*(?!\*)/g) || []).length;
  if (openItalic % 2 !== 0) return false;

  const openStrike = (markdown.match(/~~/g) || []).length;
  if (openStrike % 2 !== 0) return false;

  const openCode = (markdown.match(/`/g) || []).length;
  if (openCode % 2 !== 0) return false;

  return true;
}
