import type { JSONContent } from "@tiptap/react";

type MarkdownNode = JSONContent;
type MarkdownMark = NonNullable<MarkdownNode["marks"]>[number];

function wrapWithMark(text: string, mark: MarkdownMark): string {
  switch (mark.type) {
    case "bold":
      return `**${text}**`;
    case "italic":
      return `*${text}*`;
    case "strike":
      return `~~${text}~~`;
    case "code":
      return `\`${text}\``;
    case "underline":
      return `<u>${text}</u>`;
    case "link": {
      const href = mark.attrs?.href;
      return href ? `[${text}](${href})` : text;
    }
    default:
      return text;
  }
}

function serializePlainText(nodes?: MarkdownNode[]): string {
  if (!nodes?.length) return "";

  return nodes
    .map((node) => {
      if (node.type === "text") {
        return node.text ?? "";
      }
      if (node.type === "hardBreak") {
        return "\n";
      }
      if (node.content) {
        return serializePlainText(node.content);
      }
      return "";
    })
    .join("");
}

function serializeInline(nodes?: MarkdownNode[]): string {
  if (!nodes?.length) return "";

  return nodes
    .map((node) => {
      if (node.type === "text") {
        const marks = node.marks ?? [];
        const text = node.text ?? "";
        return marks.reduce((acc, mark) => wrapWithMark(acc, mark), text);
      }
      if (node.type === "hardBreak") {
        return "\n";
      }
      if (node.content) {
        return serializeInline(node.content);
      }
      return "";
    })
    .join("");
}

function serializeListItem(
  item: MarkdownNode,
  ordered: boolean,
  indentLevel: number,
  index: number
): string {
  const indent = "  ".repeat(indentLevel);
  const prefix = ordered ? `${index + 1}. ` : "- ";
  const inlineParts: string[] = [];
  const nestedBlocks: string[] = [];

  (item.content ?? []).forEach((child) => {
    if (child.type === "paragraph") {
      const text = serializeInline(child.content);
      if (text) {
        inlineParts.push(text);
      }
      return;
    }

    if (child.type === "bulletList") {
      nestedBlocks.push(serializeList(child, false, indentLevel + 1));
      return;
    }

    if (child.type === "orderedList") {
      nestedBlocks.push(serializeList(child, true, indentLevel + 1));
      return;
    }

    const block = serializeBlock(child, indentLevel + 1);
    if (block) {
      nestedBlocks.push(block);
    }
  });

  const inlineText = inlineParts.join(" ").trim();
  const lines = [`${indent}${prefix}${inlineText}`.trimEnd()];
  nestedBlocks.forEach((block) => {
    if (block) {
      lines.push(block);
    }
  });

  return lines.join("\n");
}

function serializeList(
  node: MarkdownNode,
  ordered: boolean,
  indentLevel: number
): string {
  const items = node.content ?? [];
  return items
    .map((item, index) =>
      serializeListItem(item, ordered, indentLevel, index)
    )
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

function serializeBlock(node: MarkdownNode, indentLevel: number): string {
  switch (node.type) {
    case "paragraph":
      return serializeInline(node.content);
    case "heading": {
      const level = node.attrs?.level ?? 1;
      const prefix = "#".repeat(Math.min(Math.max(level, 1), 6));
      return `${prefix} ${serializeInline(node.content)}`.trim();
    }
    case "bulletList":
      return serializeList(node, false, indentLevel);
    case "orderedList":
      return serializeList(node, true, indentLevel);
    case "blockquote": {
      const inner = serializeBlocks(node.content, indentLevel).join("\n");
      return inner
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    }
    case "codeBlock": {
      const code = serializePlainText(node.content);
      return ["```", code, "```"].join("\n");
    }
    case "horizontalRule":
      return "---";
    default:
      if (node.content) {
        return serializeBlocks(node.content, indentLevel).join("\n\n");
      }
      return "";
  }
}

function serializeBlocks(
  nodes?: MarkdownNode[],
  indentLevel = 0
): string[] {
  if (!nodes?.length) return [];

  return nodes
    .map((node) => serializeBlock(node, indentLevel))
    .filter((block) => block.trim().length > 0);
}

export function tiptapToMarkdown(doc: MarkdownNode): string {
  if (!doc || !doc.content) return "";
  const blocks = serializeBlocks(doc.content);
  return blocks.join("\n\n").trim();
}
