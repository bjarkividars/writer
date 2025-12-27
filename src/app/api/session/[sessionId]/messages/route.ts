import { prisma } from "@/lib/prisma";
import {
  AppendMessageRequestSchema,
  AppendMessageResponseSchema,
  SessionIdSchema,
} from "@/lib/api/contracts";
import { requireSessionAccess } from "@/lib/session-access";

type RouteParams = { params: { sessionId: string } };

export async function POST(request: Request, { params }: RouteParams) {
  const sessionId = SessionIdSchema.parse(params.sessionId);
  const access = await requireSessionAccess(sessionId);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const body = AppendMessageRequestSchema.parse(await request.json());
  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: body.role,
      content: body.content,
    },
  });

  const payload = AppendMessageResponseSchema.parse({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  });

  return Response.json(payload);
}
