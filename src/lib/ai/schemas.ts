import { z } from "zod";

export const BlockTypeSchema = z.enum([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
]);

export type BlockType = z.infer<typeof BlockTypeSchema>;

export const BlockItemSchema = z
  .object({
  id: z.string(),
  blockNum: z.number().int().min(1),
  itemNum: z.number().int().min(1),
  blockType: BlockTypeSchema,
  headingLevel: z.number().int().min(1).max(3).optional(),
  from: z.number().int().min(0),
  to: z.number().int().min(0),
  text: z.string(),
  })
  .strict();

export type BlockItem = z.infer<typeof BlockItemSchema>;

/**
 * Sentence with stable ID for AI targeting
 */
export const Sentence = z
  .object({
  id: z.string().describe("Sentence ID like '1.1', '1.2' etc."),
  paragraphNum: z.number().int().min(1),
  sentenceNum: z.number().int().min(1),
  from: z.number().int().min(0),
  to: z.number().int().min(0),
  text: z.string(),
  })
  .strict();

export type Sentence = z.infer<typeof Sentence>;

/**
 * Edit request payload - what we send to the AI API (from client)
 */
export const EditRequest = z
  .object({
  instruction: z.string(),
  mode: z.enum(["inline", "chat"]).optional(),
  selection: z
    .object({
      from: z.number().int().min(0),
      to: z.number().int().min(0),
      text: z.string(),
    })
    .strict()
    .optional(),
  documentText: z.string(),
  blockMap: z.array(BlockItemSchema).optional(),
  })
  .strict();

export type EditRequest = z.infer<typeof EditRequest>;

/**
 * Edit target for AI response (uses block item IDs)
 *
 * Note: Using a single object with required fields to satisfy OpenAI's
 * structured output requirements (no optional fields, no oneOf)
 */
export const AiEditTarget = z
  .object({
  kind: z
    .enum(["block-item"])
    .describe(
      "Target type: 'block-item' to replace a specific block item by ID"
    ),
  itemId: z
    .string()
    .describe(
      "Item ID when kind='block-item' (e.g., 'block-2.3')."
    ),
  })
  .strict();

// TypeScript type remains discriminated union for type safety
export type AiEditTarget =
  | { kind: "block-item"; itemId: string };

export const ReplaceOperation = z
  .object({
  type: z.literal("replace"),
  replacement: z.string(),
  })
  .strict();

export const InsertItemOperation = z
  .object({
  type: z.literal("insert-item"),
  position: z.enum(["before", "after"]),
  items: z.array(z.string()),
  })
  .strict();

export const InsertBlockOperation = z
  .object({
  type: z.literal("insert-block"),
  position: z.enum(["before", "after"]),
  blockType: BlockTypeSchema,
  headingLevel: z.number().int().min(1).max(3).nullable(),
  items: z.array(z.string()),
  })
  .strict();

export const DeleteItemOperation = z
  .object({
  type: z.literal("delete-item"),
  })
  .strict();

export const DeleteBlockOperation = z
  .object({
  type: z.literal("delete-block"),
  })
  .strict();

export const TransformBlockOperation = z
  .object({
  type: z.literal("transform-block"),
  blockType: BlockTypeSchema,
  headingLevel: z.number().int().min(1).max(3).nullable(),
  items: z.array(z.string()),
  })
  .strict();

export const AiEditOperation = z.union([
  ReplaceOperation,
  InsertItemOperation,
  InsertBlockOperation,
  DeleteItemOperation,
  DeleteBlockOperation,
  TransformBlockOperation,
]);

export type AiEditOperation = z.infer<typeof AiEditOperation>;

/**
 * Resolved edit target (absolute positions for client)
 */
export const ResolvedEditTarget = z
  .object({
  from: z.number().int().min(0),
  to: z.number().int().min(0),
  })
  .strict();

export type ResolvedEditTarget = z.infer<typeof ResolvedEditTarget>;

/**
 * Single edit operation from AI (with block item IDs + structured operation)
 */
export const AiEditOp = z
  .object({
  target: AiEditTarget,
  operation: AiEditOperation,
  })
  .strict();

export type AiEditOp = z.infer<typeof AiEditOp>;

/**
 * Resolved edit operation (for client, with absolute positions)
 */
export const ResolvedEditOp = z
  .object({
  target: ResolvedEditTarget,
  operation: AiEditOperation,
  })
  .strict();

export type ResolvedEditOp = z.infer<typeof ResolvedEditOp>;

/**
 * AI edit output - response from LLM (with block item IDs)
 */
export const AiEditOutput = z
  .object({
  edits: z
    .array(AiEditOp)
    .describe(
      "Array of edit operations to apply. Keep minimal (1-3 edits). Can be empty array if no edits yet."
    ),
  message: z
    .string()
    .describe(
      "Brief summary or clarification question for the user. Use an empty string if not needed."
    ),
  complete: z
    .boolean()
    .describe("Set to true when all edits are finalized and ready to apply"),
  })
  .strict();

export type AiEditOutput = z.infer<typeof AiEditOutput>;

/**
 * Resolved edit response - what we send to the client (with absolute positions)
 */
export const ResolvedEditResponse = z
  .object({
  edits: z.array(ResolvedEditOp),
  complete: z.boolean(),
  })
  .strict();

export type ResolvedEditResponse = z.infer<typeof ResolvedEditResponse>;
