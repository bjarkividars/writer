import { openai } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { NextRequest } from "next/server";
import { EditRequest, AiEditOutput } from "@/lib/ai/schemas";

/**
 * POST /api/ai/edit
 *
 * Streams structured AI edits for a document based on user instruction.
 * Returns a streaming response consumable by useObject on the frontend.
 */
export async function POST(req: NextRequest) {
    try {
        // Parse and validate request body
        const body = await req.json();
        console.log("[BE] Received request:", {
            instruction: body.instruction,
            docVersion: body.docVersion,
            selection: body.selection,
            allowedRange: body.allowedRange,
            regionsCount: body.regions?.length,
        });
        
        const request = EditRequest.parse(body);

        // Build the prompt with structured context
        const prompt = buildPrompt(request);
        console.log("[BE] Built prompt, length:", prompt.length);

        // Stream structured output using AI SDK
        const result = streamText({
            model: openai("gpt-5.2"),
            prompt,
            output: Output.object({
                schema: AiEditOutput,
            }),
            maxOutputTokens: 2000,
            onFinish: (event) => {
                console.log("[BE] Stream finished:", {
                    usage: event.usage,
                    finishReason: event.finishReason,
                });
            },
        });

        console.log("[BE] Starting stream...");
        // Return as text stream for useObject consumption
        return result.toTextStreamResponse();
    } catch (error) {
        console.error("[BE] Error in /api/ai/edit:", error);

        // Return error as JSON for better client handling
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

/**
 * Build a detailed prompt for the AI model
 */
function buildPrompt(request: EditRequest): string {
    const {
        instruction,
        docVersion,
        selection,
        allowedRange,
        regions,
        docText,
    } = request;

    // Format regions for the prompt
    const regionsText = regions
        .map((r) => {
            return `  - ID: "${r.id}"
    Kind: ${r.kind}
    Label: ${r.label || "N/A"}
    Range: [${r.from}, ${r.to}]
    Text: "${r.text}"`;
        })
        .join("\n\n");

    return `You are a precise document editor. Make targeted edits to a document based on the user's instruction.

**CRITICAL RULES:**
1. Echo the EXACT docVersion: "${docVersion}"
2. ALL edits MUST be within: [${allowedRange.from}, ${allowedRange.to}]
3. Prefer region-offset targets when possible (more stable)
4. Keep edits minimal (1-3 operations)
5. Set complete=true when finished

**USER INSTRUCTION:**
${instruction}

**DOCUMENT CONTEXT:**

Document Version: ${docVersion}
${selection ? `\nCurrent Selection: [${selection.from}, ${selection.to}]\nSelected Text: "${selection.text}"` : "No text selected"}

Allowed Edit Range: [${allowedRange.from}, ${allowedRange.to}]

**AVAILABLE REGIONS (use these IDs for region-offset targets):**

${regionsText}

${docText ? `\n**FULL DOCUMENT TEXT:**\n${docText}\n` : ""}

**OUTPUT FORMAT:**

{
  "docVersion": "${docVersion}",
  "edits": [
    {
      "target": {
        "kind": "region-offset" or "range",
        // For region-offset: provide regionId, startOffset, endOffset (others null)
        // For range: provide from, to (others null)
      },
      "replacement": "new text here"
    }
  ],
  "complete": true
}

**STRATEGY:**

1. If there's a selection, focus edits on that
2. Use region-offset when the edit aligns with a region
3. Use range for cross-region or precise edits
4. Minimize edits - combine when possible`;
}

