import { prisma } from "@/lib/prisma";
import {
  GetSessionResponseSchema,
  SaveDocumentRequestSchema,
  SaveDocumentResponseSchema,
  SessionIdSchema,
} from "@/lib/api/contracts";
import { requireSessionAccess } from "@/lib/session-access";
import { z } from "zod";

type RouteParams = { params: Promise<{ sessionId: string }> };

export async function GET(_: Request, { params }: RouteParams) {
  const sessionId = SessionIdSchema.parse((await params).sessionId);
  const access = await requireSessionAccess(sessionId);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }
  const session = await prisma.workspaceSession.findUnique({
    where: { id: sessionId },
    include: {
      document: true,
      messages: { orderBy: { createdAt: "asc" }, include: { options: true } },
    },
  });

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const payload = GetSessionResponseSchema.parse({
    sessionId,
    title: session.title ?? null,
    document: session.document?.content ?? null,
    messages: session.messages.map((message) => ({
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
      selectedOptionId: message.selectedOptionId,
    })),
  });

  return Response.json(payload);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const sessionId = SessionIdSchema.parse((await params).sessionId);
  const access = await requireSessionAccess(sessionId);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const body = SaveDocumentRequestSchema.parse(await request.json());
  const document = await prisma.document.upsert({
    where: { sessionId },
    update: { content: body.content },
    create: { sessionId, content: body.content },
  });

  const payload = SaveDocumentResponseSchema.parse({
    sessionId,
    updatedAt: document.updatedAt.toISOString(),
  });

  return Response.json(payload);
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const sessionId = SessionIdSchema.parse((await params).sessionId);
  const access = await requireSessionAccess(sessionId);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  await prisma.workspaceSession.delete({
    where: { id: sessionId },
  });

  return Response.json({ success: true });
}

const UpdateSessionRequestSchema = z
  .object({
    title: z.string().min(1).optional(),
  })
  .strict();

export async function PATCH(request: Request, { params }: RouteParams) {
  const sessionId = SessionIdSchema.parse((await params).sessionId);
  const access = await requireSessionAccess(sessionId);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const body = UpdateSessionRequestSchema.parse(await request.json());
  const session = await prisma.workspaceSession.update({
    where: { id: sessionId },
    data: body,
  });

  return Response.json({
    sessionId: session.id,
    title: session.title,
    updatedAt: session.updatedAt.toISOString(),
  });
}
