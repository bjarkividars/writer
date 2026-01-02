import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/server/services/errors";

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
  selectedOptionId?: string;
};

function mapMessage(message: {
  id: string;
  role: "user" | "model";
  content: string;
  createdAt: Date;
  selectedOptionId: string | null;
  options: { id: string; index: number; title: string; content: string }[];
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
    selectedOptionId: message.selectedOptionId ?? undefined,
  };
}

export async function appendMessage(input: {
  sessionId: string;
  role: "user" | "model";
  content: string;
  options?: { index: number; title: string; content: string }[];
}): Promise<SessionMessage> {
  if (input.options?.length && input.role !== "model") {
    throw new ServiceError(
      "BAD_REQUEST",
      "Options can only be attached to model messages."
    );
  }

  const message = await prisma.chatMessage.create({
    data: {
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      options: input.options?.length
        ? {
            create: input.options.map((option) => ({
              index: option.index,
              title: option.title,
              content: option.content,
            })),
          }
        : undefined,
    },
    include: { options: true },
  });

  return mapMessage({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    selectedOptionId: message.selectedOptionId,
    options: message.options.map((option) => ({
      id: option.id,
      index: option.index,
      title: option.title,
      content: option.content,
    })),
  });
}

export async function selectMessageOption(input: {
  sessionId: string;
  messageId: string;
  index: number;
}): Promise<SessionMessage> {
  const message = await prisma.chatMessage.findUnique({
    where: { id: input.messageId },
    include: { options: true },
  });

  if (!message || message.sessionId !== input.sessionId) {
    throw new ServiceError("NOT_FOUND", "Message not found");
  }

  if (message.role !== "model") {
    throw new ServiceError(
      "BAD_REQUEST",
      "Only model messages can be selected."
    );
  }

  if (message.selectedOptionId) {
    throw new ServiceError("CONFLICT", "Option already selected.");
  }

  const latestMessage = await prisma.chatMessage.findFirst({
    where: { sessionId: input.sessionId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!latestMessage || latestMessage.id !== input.messageId) {
    throw new ServiceError("CONFLICT", "Only the latest message can be selected.");
  }

  const selectedOption = message.options.find(
    (option) => option.index === input.index
  );

  if (!selectedOption) {
    throw new ServiceError("NOT_FOUND", "Option not found");
  }

  const updatedMessage = await prisma.$transaction(async (tx) => {
    await tx.chatMessage.update({
      where: { id: input.messageId },
      data: { selectedOptionId: selectedOption.id },
    });

    await tx.chatMessageOption.deleteMany({
      where: {
        messageId: input.messageId,
        id: { not: selectedOption.id },
      },
    });

    return tx.chatMessage.findUnique({
      where: { id: input.messageId },
      include: { options: true },
    });
  });

  if (!updatedMessage) {
    throw new ServiceError("NOT_FOUND", "Message not found");
  }

  return mapMessage({
    id: updatedMessage.id,
    role: updatedMessage.role,
    content: updatedMessage.content,
    createdAt: updatedMessage.createdAt,
    selectedOptionId: updatedMessage.selectedOptionId,
    options: updatedMessage.options.map((option) => ({
      id: option.id,
      index: option.index,
      title: option.title,
      content: option.content,
    })),
  });
}
