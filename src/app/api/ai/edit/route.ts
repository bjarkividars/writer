import { openai } from "@ai-sdk/openai";
// import { google } from "@ai-sdk/google";
import { streamText, Output } from "ai";
import { NextRequest } from "next/server";
import { SentenceTokenizer } from "natural";
import {
    EditRequest,
    AiEditOutput,
    type BlockItem,
} from "@/lib/ai/schemas";

/**
 * POST /api/ai/edit
 *
 * Streams structured AI edits for a document based on user instruction.
 * Server builds block map, sends it as first chunk, then streams AI response.
 */
export async function POST(req: NextRequest) {
    try {
        // Parse and validate request body
        const body = await req.json();
        console.log("[BE] Received request:", {
            instruction: body.instruction,
            selection: body.selection,
            documentTextLength: body.documentText?.length,
        });

        const request = EditRequest.parse(body);

        const blockMapResult = request.blockMap
            ? { items: request.blockMap }
            : buildBlockMapFromText(request.documentText);
        const { items } = blockMapResult;

        console.log("[BE] Built block map:", {
            itemsCount: items.length,
            selection: request.selection,
        });

        // Build the prompt with structured context
        const prompt = buildPrompt({
            instruction: request.instruction,
            selection: request.selection,
            items,
        });
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

        // Create combined stream: block map first, then AI response
        const blockMapChunk = JSON.stringify({ blockMap: items }) + "\n";

        const combinedStream = new ReadableStream({
            async start(controller) {
                try {
                    // Send block map as first chunk
                    controller.enqueue(new TextEncoder().encode(blockMapChunk));
                    console.log("[BE] Sent block map");

                    // Then stream AI response as-is
                    const reader = result.textStream.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        controller.enqueue(new TextEncoder().encode(value));
                    }

                    controller.close();
                } catch (error) {
                    console.error("[BE] Stream error:", error);
                    controller.error(error);
                }
            },
        });

        return new Response(combinedStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (error) {
        console.error("[BE] Error in /api/ai/edit:", error);

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
 * Build block map from plain text using natural library
 */
function buildBlockMapFromText(text: string) {
    const tokenizer = new SentenceTokenizer([]);
    const lines = text.split("\n").filter((l) => l.trim());
    const items: BlockItem[] = [];

    let currentPos = 0;
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

/**
 * Build a concise prompt for the AI model
 */
function buildPrompt(params: {
    instruction: string;
    selection?: { from: number; to: number; text: string };
    items: BlockItem[];
}): string {
    const { instruction, selection, items } = params;

    const itemsText = items
        .map((item) => {
            const typeLabel =
                item.blockType === "heading"
                    ? `heading-${item.headingLevel ?? 1}`
                    : item.blockType === "bulletList"
                    ? "bullet"
                    : item.blockType === "orderedList"
                    ? "numbered"
                    : "paragraph";
            return `${item.id} [${typeLabel}]: "${item.text}"`;
        })
        .join("\n");

    return `You are a document editor. Apply the user's instruction using markdown formatting.

**USER INSTRUCTION:**
${instruction}

${selection ? `**CURRENT SELECTION:**\n"${selection.text}"\n` : ""}
**AVAILABLE ITEMS:**
${itemsText}

**EXAMPLES:**

"make block-2.1 bold"
→ {"edits": [{"target": {"kind": "block-item", "itemId": "block-2.1"}, "operation": {"type": "replace", "replacement": "**text here**"}}], "complete": true}

"insert a sentence after block-1.2"
→ {"edits": [{"target": {"kind": "block-item", "itemId": "block-1.2"}, "operation": {"type": "insert-item", "position": "after", "items": ["New sentence."]}}], "complete": true}

"insert a level 2 heading before block-3.1"
→ {"edits": [{"target": {"kind": "block-item", "itemId": "block-3.1"}, "operation": {"type": "insert-block", "position": "before", "blockType": "heading", "headingLevel": 2, "items": ["New heading"]}}], "complete": true}

"insert two paragraphs after block-1.1"
→ {"edits": [{"target": {"kind": "block-item", "itemId": "block-1.1"}, "operation": {"type": "insert-block", "position": "after", "blockType": "paragraph", "headingLevel": null, "items": ["First paragraph."]}}, {"target": {"kind": "block-item", "itemId": "block-1.1"}, "operation": {"type": "insert-block", "position": "after", "blockType": "paragraph", "headingLevel": null, "items": ["Second paragraph."]}}], "complete": true}

"delete block-2.3"
→ {"edits": [{"target": {"kind": "block-item", "itemId": "block-2.3"}, "operation": {"type": "delete-item"}}], "complete": true}

"delete the block containing block-4.1"
→ {"edits": [{"target": {"kind": "block-item", "itemId": "block-4.1"}, "operation": {"type": "delete-block"}}], "complete": true}

"convert block-2.1 to a bullet list"
→ {"edits": [{"target": {"kind": "block-item", "itemId": "block-2.1"}, "operation": {"type": "transform-block", "blockType": "bulletList", "headingLevel": null, "items": ["First item", "Second item"]}}], "complete": true}

**RULES:**
1. Always include an "operation" object with a "type".
2. Paragraphs/headings: Use inline markdown (**bold**, *italic*, ~~strike~~, \`code\`).
3. Headings: Do NOT include # markers in item text; use "headingLevel" on operations instead.
4. List items: Inline markdown only (no bullets, already in list).
5. insert-item: "items" are sentences for paragraphs/headings, list items for lists.
6. insert-block: set "blockType" and "headingLevel" (use null when not heading).
7. transform-block: replace the entire block with the provided items + blockType.
8. Paragraph/heading items must be single sentences with no line breaks.
9. If multiple paragraphs are needed, use multiple insert-block operations (one per paragraph).
10. Item IDs refer to existing items only; never invent new IDs.
11. When inserting multiple blocks after/before the same itemId, keep them ordered in the edits array.
12. Always target items using "block-item" with an itemId`;
}
