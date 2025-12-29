import { prisma } from "@/lib/prisma";
import {
  MessageIdSchema,
  SelectMessageOptionRequestSchema,
  SelectMessageOptionResponseSchema,
  SessionIdSchema,
} from "@/lib/api/contracts";
import { requireSessionAccess } from "@/lib/session-access";

type RouteParams = { params: Promise<{ sessionId: string; messageId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { sessionId, messageId } = await params;
  const parsedSessionId = SessionIdSchema.parse(sessionId);
  const parsedMessageId = MessageIdSchema.parse(messageId);
  const access = await requireSessionAccess(parsedSessionId);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const body = SelectMessageOptionRequestSchema.parse(await request.json());

  const message = await prisma.chatMessage.findUnique({
    where: { id: parsedMessageId },
    include: { options: true },
  });

  if (!message || message.sessionId !== parsedSessionId) {
    return Response.json({ error: "Message not found" }, { status: 404 });
  }

  if (message.role !== "model") {
    return Response.json(
      { error: "Only model messages can be selected." },
      { status: 400 }
    );
  }

  if (message.selectedOptionId) {
    return Response.json(
      { error: "Option already selected." },
      { status: 409 }
    );
  }

  const latestMessage = await prisma.chatMessage.findFirst({
    where: { sessionId: parsedSessionId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!latestMessage || latestMessage.id !== parsedMessageId) {
    return Response.json(
      { error: "Only the latest message can be selected." },
      { status: 409 }
    );
  }

  const selectedOption = message.options.find(
    (option) => option.index === body.index
  );

  if (!selectedOption) {
    return Response.json({ error: "Option not found" }, { status: 404 });
  }

  const updatedMessage = await prisma.$transaction(async (tx) => {
    await tx.chatMessage.update({
      where: { id: parsedMessageId },
      data: { selectedOptionId: selectedOption.id },
    });

    await tx.chatMessageOption.deleteMany({
      where: {
        messageId: parsedMessageId,
        id: { not: selectedOption.id },
      },
    });

    return tx.chatMessage.findUnique({
      where: { id: parsedMessageId },
      include: { options: true },
    });
  });

  if (!updatedMessage) {
    return Response.json({ error: "Message not found" }, { status: 404 });
  }

  const payload = SelectMessageOptionResponseSchema.parse({
    id: updatedMessage.id,
    role: updatedMessage.role,
    content: updatedMessage.content,
    createdAt: updatedMessage.createdAt.toISOString(),
    options: updatedMessage.options.map((option) => ({
      id: option.id,
      index: option.index,
      title: option.title,
      content: option.content,
    })),
    selectedOptionId: updatedMessage.selectedOptionId,
  });

  return Response.json(payload);
}
