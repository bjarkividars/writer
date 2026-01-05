import { openai } from "@ai-sdk/openai";
// import { google } from "@ai-sdk/google";
import { streamText, Output } from "ai";
import { NextRequest } from "next/server";
import { SentenceTokenizer } from "natural";
import { prisma } from "@/lib/prisma";
import { requireSessionAccess } from "@/lib/session-access";
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

        let chatHistory: { role: "user" | "model"; content: string }[] = [];
        if (request.sessionId) {
            const access = await requireSessionAccess(request.sessionId);
            if (!access.ok) {
                return Response.json({ error: access.error }, { status: access.status });
            }

            const messages = await prisma.chatMessage.findMany({
                where: { sessionId: request.sessionId },
                orderBy: { createdAt: "desc" },
                take: 20,
                select: { role: true, content: true },
            });

            chatHistory = messages.reverse().map((message) => ({
                role: message.role as "user" | "model",
                content: message.content,
            }));

            const lastMessage = chatHistory.at(-1);
            if (
                lastMessage?.role === "user" &&
                lastMessage.content.trim() === request.instruction.trim()
            ) {
                chatHistory = chatHistory.slice(0, -1);
            }
        }

        console.log("[BE] Built block map:", {
            itemsCount: items.length,
            selection: request.selection,
            chatHistoryCount: chatHistory.length,
        });

        // Build the prompt with structured context
        const prompt = buildPrompt({
            instruction: request.instruction,
            mode: request.mode ?? "inline",
            selection: request.selection,
            items,
            chatHistory,
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

/**
 * Build a concise prompt for the AI model
 */
function buildPrompt(params: {
    instruction: string;
    mode: "inline" | "chat";
    selection?: { from: number; to: number; text: string };
    items: BlockItem[];
    chatHistory: { role: "user" | "model"; content: string }[];
}): string {
    const { instruction, mode, selection, items, chatHistory } = params;

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

    const chatHistoryText = chatHistory
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n");
    const chatHistorySection = chatHistoryText
        ? `**CHAT HISTORY:**\n${chatHistoryText}\n\n`
        : "";

    return `You are a document editor. Your sole role is to help the user write the document and nothing else. Apply the user's instruction using markdown formatting.
Never include conversational text in the document. Do not ask or answer questions in the document content.
If a question needs to be asked, ask it only in the message field.

**USER INSTRUCTION:**
${instruction}

**MODE:** ${mode}

${chatHistorySection}${selection ? `**CURRENT SELECTION:**\n"${selection.text}"\n` : ""}
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
1. Edits must contain only document content; never add conversational filler, meta commentary, or system instructions.
2. Never include questions or answers in the document content. If you must ask a question, ask it only in message.
3. If the user asks a question that is not a clear writing instruction, do not answer it; ask how to incorporate it into the document.
4. Always include an "operation" object with a "type".
5. Paragraphs/headings: Use inline markdown (**bold**, *italic*, ~~strike~~, \`code\`).
6. Headings: NEVER include markdown heading markers (#, ##, ###) in any text; use "headingLevel" on operations instead.
7. List items: INLINE markdown only (no bullets, already in list).
8. insert-item: "items" are sentences for paragraphs/headings, list items for lists.
9. insert-block: set "blockType" and "headingLevel" (use null when not heading).
10. transform-block: replace the entire block with the provided items + blockType.
11. Paragraph/heading items MUST be single sentences with no line breaks.
12. For multi-sentence paragraphs, include multiple items in the same block (one sentence per item).
13. Paragraph breaks must be separate blocks; never include blank lines or multiple paragraphs in one item.
14. If multiple paragraphs are needed, use multiple insert-block operations (one per paragraph).
15. Item IDs refer to existing items only; never invent new IDs.
16. When inserting multiple blocks after/before the same itemId, keep them ordered in the edits array.
17. Always target items using "block-item" with an itemId.
18. Always include a "message" field in the output JSON.
19. message must be plain text with no quotes or newlines.
20. message must be human-readable and user-facing; do not mention block IDs, operations, internal rules, or technical terms.
21. Always include an "options" array; use [] when you have no alternatives.
22. If you provide multiple options, include 2-4 items; each item must include "title" and "content" fields.
23. If options has any items, edits MUST be an empty array (no edits are allowed when presenting options).
24. If edits has any items, options MUST be an empty array (no options when applying edits).
25. options must be user-facing and readable; never include block IDs, operations, or technical terms.
26. Do not restate the options in the message. When options are present, message should be a brief prompt like "Pick a direction to continue."
27. Option "content" may be a concise description of the direction; it does not need to include full verbatim rewrites for long passages.
28. If MODE=chat, message must be a 1-2 sentence summary of edits (when edits are present), or a clarification question if needed.
29. If MODE=inline, only set message when you need clarification; otherwise set message to "".
30. If you need clarification, set edits to [] and ask the question in message.
31. If the only available item has empty text, use a replace operation on that item to create the initial content.`;
}
