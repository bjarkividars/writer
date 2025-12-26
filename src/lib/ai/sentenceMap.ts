import type { Editor } from "@tiptap/react";
import { SentenceTokenizer } from "natural";

/**
 * Sentence with stable ID for AI targeting
 */
export type Sentence = {
  id: string; // "1.1", "1.2", etc.
  paragraphNum: number; // 1, 2, 3...
  sentenceNum: number; // 1, 2, 3... within paragraph
  from: number; // Absolute position in document
  to: number; // Absolute position in document
  text: string; // Raw sentence text
};

/**
 * Result of building a sentence map from the editor state
 */
export type SentenceMapResult = {
  sentences: Sentence[];
  selection?: { from: number; to: number; text: string };
};

/**
 * Build a sentence map from the current TipTap editor state
 *
 * This creates a numbered map of sentences (e.g., "1.1", "1.2") that the AI
 * can use to reliably target specific text without character counting.
 */
export function buildSentenceMap(editor: Editor): SentenceMapResult {
  const { state } = editor;
  const { doc, selection } = state;
  const { from: selectionFrom, to: selectionTo, empty } = selection;

  const sentences: Sentence[] = [];
  const tokenizer = new SentenceTokenizer([]);

  let paragraphNum = 0;

  // Traverse document and extract sentences from each paragraph
  doc.descendants((node, pos) => {
    // Process paragraphs, headings, and list items
    if (
      (node.type.name === "paragraph" ||
        node.type.name === "heading" ||
        node.type.name === "listItem") &&
      node.textContent.trim()
    ) {
      paragraphNum++;
      const paragraphText = node.textContent;

      // Tokenize into sentences
      const sentenceTexts = tokenizer.tokenize(paragraphText);

      // Handle case where tokenizer returns null (empty or unparseable)
      if (!sentenceTexts || sentenceTexts.length === 0) {
        // Treat entire paragraph as single sentence
        sentences.push({
          id: `${paragraphNum}.1`,
          paragraphNum,
          sentenceNum: 1,
          from: pos + 1,
          to: pos + node.nodeSize - 1,
          text: paragraphText,
        });
        return true;
      }

      // Map each sentence to its position in the document
      let searchPos = 0;
      sentenceTexts.forEach((sentText, idx) => {
        // Find sentence position within paragraph text
        const sentStart = paragraphText.indexOf(sentText, searchPos);

        if (sentStart !== -1) {
          const sentEnd = sentStart + sentText.length;

          sentences.push({
            id: `${paragraphNum}.${idx + 1}`,
            paragraphNum,
            sentenceNum: idx + 1,
            from: pos + 1 + sentStart,
            to: pos + 1 + sentEnd,
            text: sentText,
          });

          searchPos = sentEnd;
        }
      });
    }

    return true;
  });

  // Build selection info if present
  const selectionInfo =
    !empty && selectionFrom !== selectionTo
      ? {
          from: selectionFrom,
          to: selectionTo,
          text: state.doc.textBetween(selectionFrom, selectionTo, " "),
        }
      : undefined;

  return {
    sentences,
    selection: selectionInfo,
  };
}
