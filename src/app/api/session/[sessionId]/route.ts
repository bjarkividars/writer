import { prisma } from "@/lib/prisma";
import {
  GetSessionResponseSchema,
  SaveDocumentRequestSchema,
  SaveDocumentResponseSchema,
  SessionIdSchema,
} from "@/lib/api/contracts";
import { requireSessionAccess } from "@/lib/session-access";

type RouteParams = { params: { sessionId: string } };

export async function GET(_: Request, { params }: RouteParams) {
  const sessionId = SessionIdSchema.parse(params.sessionId);
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

  const payload = GetSessionResponseSchema.parse({
    sessionId,
    document: session.document?.content ?? null,
    messages: session.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })),
  });

  return Response.json(payload);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const sessionId = SessionIdSchema.parse(params.sessionId);
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
