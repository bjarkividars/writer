import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { requireSessionAccess } from "@/lib/session-access";
import {
  GenerateSessionTitleResponseSchema,
  SessionIdSchema,
} from "@/lib/api/contracts";

type RouteParams = { params: Promise<{ sessionId: string }> };

const TitleSchema = z.object({
  title: z.string(),
});

const MIN_CONTEXT_CHARS = 80;
const MAX_TITLE_LENGTH = 80;

function extractPlainText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const node = value as { text?: unknown; content?: unknown[]; type?: unknown };
  let output = "";

  if (typeof node.text === "string") {
    output += node.text;
  }

  if (Array.isArray(node.content)) {
    const childText = node.content
      .map((child) => extractPlainText(child))
      .filter(Boolean)
      .join(" ");
    if (childText) {
      output += (output ? " " : "") + childText;
    }
  }

  return output.trim();
}

function normalizeTitle(value: string) {
  const cleaned = value.replace(/["”“]/g, "").replace(/\s+/g, " ").trim();
  const withoutPunct = cleaned.replace(/[.!?]+$/g, "").trim();
  return withoutPunct.slice(0, MAX_TITLE_LENGTH);
}

export async function POST(_: Request, { params }: RouteParams) {
  const sessionId = SessionIdSchema.parse((await params).sessionId);
  const access = await requireSessionAccess(sessionId);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const session = await prisma.workspaceSession.findUnique({
    where: { id: sessionId },
    include: {
      document: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.title) {
    return Response.json(
      GenerateSessionTitleResponseSchema.parse({ title: session.title })
    );
  }

  const documentText = session.document
    ? extractPlainText(session.document.content)
    : "";
  const messageText = session.messages
    .slice(-4)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  if (
    documentText.trim().length < MIN_CONTEXT_CHARS &&
    messageText.trim().length < MIN_CONTEXT_CHARS
  ) {
    return Response.json(
      GenerateSessionTitleResponseSchema.parse({ title: null })
    );
  }

  const prompt = `Create a short, clear session title (4-8 words).
Use sentence case. No quotes. Avoid trailing punctuation.
Focus on the main topic.

Document:
${documentText || "(empty)"}

Recent chat:
${messageText || "(none)"}`;

  const { object } = await generateObject({
    model: openai("gpt-5.2"),
    schema: TitleSchema,
    prompt,
  });

  const nextTitle = normalizeTitle(object.title);

  if (!nextTitle) {
    return Response.json(
      GenerateSessionTitleResponseSchema.parse({ title: null })
    );
  }

  await prisma.workspaceSession.updateMany({
    where: { id: sessionId, title: null },
    data: { title: nextTitle },
  });

  const updated = await prisma.workspaceSession.findUnique({
    where: { id: sessionId },
    select: { title: true },
  });

  return Response.json(
    GenerateSessionTitleResponseSchema.parse({ title: updated?.title ?? nextTitle })
  );
}
