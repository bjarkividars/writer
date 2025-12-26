import { z } from "zod";

/**
 * Region kind - type of document region
 */
export const RegionKind = z.enum([
  "selection",
  "paragraph",
  "heading",
  "listItem",
  "section",
]);

export type RegionKind = z.infer<typeof RegionKind>;

/**
 * Document region with stable boundaries
 */
export const Region = z.object({
  id: z.string(),
  kind: RegionKind,
  from: z.number().int().min(0),
  to: z.number().int().min(0),
  text: z.string(),
  label: z.string().optional(),
});

export type Region = z.infer<typeof Region>;

/**
 * Edit request payload - what we send to the AI API
 */
export const EditRequest = z.object({
  instruction: z.string(),
  docVersion: z.string(),
  selection: z
    .object({
      from: z.number().int().min(0),
      to: z.number().int().min(0),
      text: z.string(),
    })
    .optional(),
  allowedRange: z.object({
    from: z.number().int().min(0),
    to: z.number().int().min(0),
  }),
  regions: z.array(Region),
  docText: z.string().optional(),
});

export type EditRequest = z.infer<typeof EditRequest>;

/**
 * Edit target - flattened for OpenAI structured output compatibility
 * 
 * OpenAI doesn't support oneOf and requires all fields to be in the required array.
 * We use nullable fields - check 'kind' to determine which fields to use.
 */
export const EditTarget = z
  .object({
    kind: z
      .enum(["range", "region-offset"])
      .describe(
        'Type of target: "range" for absolute positions, "region-offset" for positions relative to a region'
      ),
    // For kind="range" - provide absolute document positions (set others to null)
    from: z
      .number()
      .int()
      .min(0)
      .nullable()
      .describe("Start position (required when kind=range, null otherwise)"),
    to: z
      .number()
      .int()
      .min(0)
      .nullable()
      .describe("End position (required when kind=range, null otherwise)"),
    // For kind="region-offset" - provide region ID and offsets (set range fields to null)
    regionId: z
      .string()
      .nullable()
      .describe(
        "ID of the region from the provided regions list (required when kind=region-offset, null otherwise)"
      ),
    startOffset: z
      .number()
      .int()
      .min(0)
      .nullable()
      .describe(
        "Start offset within the region text (required when kind=region-offset, null otherwise)"
      ),
    endOffset: z
      .number()
      .int()
      .min(0)
      .nullable()
      .describe(
        "End offset within the region text (required when kind=region-offset, null otherwise)"
      ),
  })
  .describe(
    "Target location for the edit. Use region-offset when possible for stability."
  );

export type EditTarget = z.infer<typeof EditTarget>;

/**
 * Single edit operation from the model
 */
export const EditOp = z
  .object({
    target: EditTarget,
    replacement: z
      .string()
      .describe("The new text to insert at the target location"),
  })
  .describe("A single text replacement operation")
  .refine(
    (op) => {
      if (op.target.kind === "range") {
        return (
          op.target.to !== null &&
          op.target.from !== null &&
          op.target.to >= op.target.from
        );
      }
      return (
        op.target.endOffset !== null &&
        op.target.startOffset !== null &&
        op.target.endOffset >= op.target.startOffset
      );
    },
    {
      message: "End position must be >= start position and fields must not be null",
    }
  );

export type EditOp = z.infer<typeof EditOp>;

/**
 * AI edit output - streamed response from the API
 */
export const AiEditOutput = z
  .object({
    docVersion: z
      .string()
      .describe(
        "Echo the exact docVersion from the request (for staleness detection)"
      ),
    edits: z
      .array(EditOp)
      .describe(
        "Array of edit operations to apply. Keep minimal (1-3 edits). All edits must be within the provided allowedRange. Can be empty array if no edits yet."
      ),
    complete: z
      .boolean()
      .describe("Set to true when all edits are finalized and ready to apply"),
  })
  .describe("Response containing document edits based on the user's instruction");

export type AiEditOutput = z.infer<typeof AiEditOutput>;

