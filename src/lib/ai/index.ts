/**
 * AI Edit System
 *
 * This module provides utilities for building structured edit requests
 * for AI-powered document editing with TipTap/ProseMirror.
 */

// Schemas
export {
  Sentence,
  EditRequest,
  AiEditTarget,
  AiEditOp,
  AiEditOutput,
  AiEditOperation,
} from "./schemas";

export type {
  BlockItem as BlockItemType,
  BlockType as BlockTypeType,
  Sentence as SentenceType,
  EditRequest as EditRequestType,
  AiEditTarget as AiEditTargetType,
  AiEditOp as AiEditOpType,
  AiEditOutput as AiEditOutputType,
  AiEditOperation as AiEditOperationType,
} from "./schemas";

// Block map builder
export { buildBlockMap } from "./blockMap";
export type { BlockMapResult } from "./blockMap";

// Sentence map builder
export { buildSentenceMap } from "./sentenceMap";
export type { SentenceMapResult, Sentence as SentenceData } from "./sentenceMap";

// Markdown parser
export {
  parseMarkdownToTipTap,
  parseMarkdownForBlock,
  isMarkdownComplete,
} from "./markdownParser";
export type { TipTapNode } from "./markdownParser";

// Document version tracking (still useful for debugging/logging)
export {
  generateDocVersion,
  validateDocVersion,
  getVersionTimestamp,
} from "./docVersion";
