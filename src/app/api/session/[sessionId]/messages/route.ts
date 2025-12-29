import { prisma } from "@/lib/prisma";
import {
  AppendMessageRequestSchema,
  AppendMessageResponseSchema,
  SessionIdSchema,
} from "@/lib/api/contracts";
import { requireSessionAccess } from "@/lib/session-access";

type RouteParams = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const sessionId = SessionIdSchema.parse((await params).sessionId);
  const access = await requireSessionAccess(sessionId);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const body = AppendMessageRequestSchema.parse(await request.json());
  if (body.options?.length && body.role !== "model") {
    return Response.json(
      { error: "Options can only be attached to model messages." },
      { status: 400 }
    );
  }
  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: body.role,
      content: body.content,
      options: body.options?.length
        ? {
            create: body.options.map((option) => ({
              index: option.index,
              title: option.title,
              content: option.content,
            })),
          }
        : undefined,
    },
    include: { options: true },
  });

  const payload = AppendMessageResponseSchema.parse({
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
  });

  return Response.json(payload);
}
