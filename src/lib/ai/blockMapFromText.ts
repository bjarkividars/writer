import { SentenceTokenizer } from "natural";
import type { BlockItem } from "@/lib/ai/schemas";

/**
 * Build block map from plain text using natural library
 */
export function buildBlockMapFromText(text: string) {
  const tokenizer = new SentenceTokenizer([]);
  const lines = text.split("\n").filter((line) => line.trim());
  const items: BlockItem[] = [];

  let currentPos = 0;
  if (lines.length === 0) {
    items.push({
      id: "block-1.1",
      blockNum: 1,
      itemNum: 1,
      blockType: "paragraph",
      from: 0,
      to: 0,
      text: "",
    });
    return { items };
  }

  lines.forEach((line, lineIdx) => {
    const blockNum = lineIdx + 1;
    const sentenceTexts = tokenizer.tokenize(line);

    if (!sentenceTexts || sentenceTexts.length === 0) {
      items.push({
        id: `block-${blockNum}.1`,
        blockNum,
        itemNum: 1,
        blockType: "paragraph",
        from: currentPos,
        to: currentPos + line.length,
        text: line,
      });
      currentPos += line.length + 1;
      return;
    }

    let searchPos = 0;
    sentenceTexts.forEach((sentText, sentIdx) => {
      const sentStart = line.indexOf(sentText, searchPos);

      if (sentStart !== -1) {
        const sentEnd = sentStart + sentText.length;

        items.push({
          id: `block-${blockNum}.${sentIdx + 1}`,
          blockNum,
          itemNum: sentIdx + 1,
          blockType: "paragraph",
          from: currentPos + sentStart,
          to: currentPos + sentEnd,
          text: sentText,
        });

        searchPos = sentEnd;
      }
    });

    currentPos += line.length + 1;
  });

  return { items };
}
