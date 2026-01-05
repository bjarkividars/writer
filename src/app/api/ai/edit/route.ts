import { openai, OpenAIChatLanguageModelOptions } from "@ai-sdk/openai";
import {
    streamText,
    Output,
} from "ai";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionAccess } from "@/lib/session-access";
import {
    buildEditMessages,
    type ChatHistoryMessage,
} from "@/lib/ai/buildEditMessages";
import { buildBlockMapFromText } from "@/lib/ai/blockMapFromText";
import {
    EditRequest,
    AiEditOutput,
} from "@/lib/ai/schemas";

/**
 * POST /api/ai/edit
 *
 * Streams structured AI edits for a document based on user instruction.
 * Server builds block map, sends it as first chunk, then streams AI response.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const request = EditRequest.parse(body);

        const blockMapResult = request.blockMap
            ? { items: request.blockMap }
            : buildBlockMapFromText(request.documentText);
        const { items } = blockMapResult;

        let chatHistory: ChatHistoryMessage[] = [];
        if (request.sessionId) {
            const access = await requireSessionAccess(request.sessionId);
            if (!access.ok) {
                return Response.json({ error: access.error }, { status: access.status });
            }

            const messages = await prisma.chatMessage.findMany({
                where: { sessionId: request.sessionId },
                orderBy: { createdAt: "desc" },
                take: 20,
                select: {
                    role: true,
                    content: true,
                    attachments: {
                        select: {
                            bucket: true,
                            key: true,
                            mimeType: true,
                            size: true,
                        },
                    },
                },
            });

            chatHistory = messages.reverse().map((message) => ({
                role: message.role as "user" | "model",
                content: message.content,
                attachments: message.attachments,
            }));

            const lastMessage = chatHistory.at(-1);
            if (
                lastMessage?.role === "user" &&
                lastMessage.content.trim() === request.instruction.trim()
            ) {
                chatHistory = chatHistory.slice(0, -1);
            }
        }

        // Build the messages with structured context
        const messages = await buildEditMessages({
            instruction: request.instruction,
            mode: request.mode ?? "inline",
            selection: request.selection,
            items,
            chatHistory,
            attachments: request.attachments,
        });

        const result = streamText({
            model: openai("gpt-5.2"),
            messages,
            output: Output.object({
                schema: AiEditOutput,
            }),
            providerOptions: {
                openai: {
                    reasoningEffort: request.mode === "chat" ? "low" : "none",
                } satisfies OpenAIChatLanguageModelOptions,
            },
            onFinish: (event) => {
                console.log("[BE] Stream finished:", {
                    usage: event.usage,
                    message: event.response.messages[0].content,
                    finishReason: event.finishReason,
                });
            },
            onError: (error) => {
                console.error("[BE] Stream error:", error);
            },
        });

        // Create combined stream: block map first, then AI response
        const blockMapChunk = JSON.stringify({ blockMap: items }) + "\n";

        const combinedStream = new ReadableStream({
            async start(controller) {
                try {
                    // Send block map as first chunk
                    controller.enqueue(new TextEncoder().encode(blockMapChunk));

                    // Then stream AI response as-is
                    const reader = result.textStream.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        controller.enqueue(new TextEncoder().encode(value));
                    }

                    controller.close();
                } catch (error) {
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
