import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DocumentContentSchema } from "@/lib/api/schemas";
import { ServiceError } from "@/server/services/errors";

const TitleSchema = z.object({
  title: z.string().nullable(),
});

const MIN_CONTEXT_CHARS = 60;
const MAX_TITLE_LENGTH = 80;

type DocumentContent = z.infer<typeof DocumentContentSchema>;

type SessionSummary = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

type MessageOption = {
  id: string;
  index: number;
  title: string;
  content: string;
};

type SessionMessage = {
  id: string;
  role: "user" | "model";
  content: string;
  createdAt: string;
  options: MessageOption[];
  attachments: {
    bucket: string;
    key: string;
    mimeType: string;
    size: number;
    originalName?: string | null;
  }[];
  selectedOptionId?: string;
};

export type SessionDetails = {
  sessionId: string;
  title: string | null;
  document: DocumentContent | null;
  messages: SessionMessage[];
};

function extractPlainText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const node = value as { text?: unknown; content?: unknown[] };
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

function normalizeTitle(value: string | null) {
  if (!value) return null;
  const cleaned = value.replace(/["”“]/g, "").replace(/\s+/g, " ").trim();
  const withoutPunct = cleaned.replace(/[.!?]+$/g, "").trim();
  const trimmed = withoutPunct.slice(0, MAX_TITLE_LENGTH).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapMessage(message: {
  id: string;
  role: "user" | "model";
  content: string;
  createdAt: Date;
  selectedOptionId: string | null;
  options: { id: string; index: number; title: string; content: string }[];
  attachments: {
    bucket: string;
    key: string;
    mimeType: string;
    size: number;
    originalName: string | null;
  }[];
}): SessionMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    options: message.options.map((option) => ({
      id: option.id,
      index: option.index,
      title: option.title,
      content: option.content,
    })),
    attachments: message.attachments.map((attachment) => ({
      bucket: attachment.bucket,
      key: attachment.key,
      mimeType: attachment.mimeType,
      size: attachment.size,
      originalName: attachment.originalName ?? undefined,
    })),
    selectedOptionId: message.selectedOptionId ?? undefined,
  };
}

export async function listSessions(input: {
  ownerId: string | null;
  anonKey: string | null;
}): Promise<{ sessions: SessionSummary[] }> {
  const sessions = await prisma.workspaceSession.findMany({
    where: input.ownerId
      ? { ownerId: input.ownerId }
      : input.anonKey
      ? { anonKey: input.anonKey, ownerId: null }
      : { id: "impossible" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return {
    sessions: sessions.map((session) => ({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    })),
  };
}

export async function createSession(input: {
  ownerId: string | null;
  anonKey: string | null;
}): Promise<{ sessionId: string }> {
  const session = await prisma.workspaceSession.create({
    data: {
      ownerId: input.ownerId,
      anonKey: input.anonKey,
    },
  });

  return { sessionId: session.id };
}

export async function getSessionDetails(sessionId: string): Promise<SessionDetails> {
  const session = await prisma.workspaceSession.findUnique({
    where: { id: sessionId },
    include: {
      document: true,
      messages: {
        orderBy: { createdAt: "asc" },
        include: { options: true, attachments: true },
      },
    },
  });

  if (!session) {
    throw new ServiceError("NOT_FOUND", "Session not found");
  }

  const documentContent = session.document?.content ?? null;

  return {
    sessionId,
    title: session.title ?? null,
    document: documentContent
      ? DocumentContentSchema.parse(documentContent)
      : null,
    messages: session.messages.map((message) =>
      mapMessage({
        id: message.id,
        role: message.role as "user" | "model",
        content: message.content,
        createdAt: message.createdAt,
        selectedOptionId: message.selectedOptionId,
        options: message.options.map((option) => ({
          id: option.id,
          index: option.index,
          title: option.title,
          content: option.content,
        })),
        attachments: message.attachments.map((attachment) => ({
          bucket: attachment.bucket,
          key: attachment.key,
          mimeType: attachment.mimeType,
          size: attachment.size,
          originalName: attachment.originalName ?? null,
        })),
      })
    ),
  };
}

export async function saveSessionDocument(input: {
  sessionId: string;
  content: DocumentContent;
}): Promise<{ sessionId: string; updatedAt: string }> {
  const document = await prisma.document.upsert({
    where: { sessionId: input.sessionId },
    update: { content: input.content },
    create: { sessionId: input.sessionId, content: input.content },
  });

  return {
    sessionId: input.sessionId,
    updatedAt: document.updatedAt.toISOString(),
  };
}

export async function updateSessionTitle(input: {
  sessionId: string;
  title: string | null;
}): Promise<{ sessionId: string; title: string | null; updatedAt: string }> {
  const session = await prisma.workspaceSession.update({
    where: { id: input.sessionId },
    data: { title: input.title },
  });

  return {
    sessionId: session.id,
    title: session.title,
    updatedAt: session.updatedAt.toISOString(),
  };
}

export async function deleteSession(sessionId: string): Promise<{ success: true }> {
  await prisma.workspaceSession.delete({
    where: { id: sessionId },
  });

  return { success: true };
}

export async function generateSessionTitle(sessionId: string): Promise<{ title: string | null }> {
  const session = await prisma.workspaceSession.findUnique({
    where: { id: sessionId },
    include: {
      document: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) {
    throw new ServiceError("NOT_FOUND", "Session not found");
  }

  if (session.title) {
    return { title: session.title };
  }

  const documentText = session.document
    ? extractPlainText(session.document.content)
    : "";
  const messageText = session.messages
    .slice(-4)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  const trimmedDocumentText = documentText.trim();
  const trimmedMessageText = messageText.trim();
  const hasMessageContext = trimmedMessageText.length > 0;

  if (!trimmedDocumentText && !trimmedMessageText) {
    return { title: null };
  }

  if (!hasMessageContext && trimmedDocumentText.length < MIN_CONTEXT_CHARS) {
    return { title: null };
  }

  const prompt = `Create a short, clear session title (4-8 words).
Use sentence case. No quotes. Avoid trailing punctuation.
Focus on the main topic.
If you cannot confidently name the session yet, return null.

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
    return { title: null };
  }

  await prisma.workspaceSession.updateMany({
    where: { id: sessionId, title: null },
    data: { title: nextTitle },
  });

  const updated = await prisma.workspaceSession.findUnique({
    where: { id: sessionId },
    select: { title: true },
  });

  return { title: updated?.title ?? nextTitle };
}
