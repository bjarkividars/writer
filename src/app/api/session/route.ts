import { CreateSessionResponseSchema } from "@/lib/api/contracts";
import { prisma } from "@/lib/prisma";
import { ensureAnonKey, getOwnerId } from "@/lib/session-auth";

export async function POST(_: Request) {
  const ownerId = await getOwnerId();
  const anonKey = ownerId ? null : await ensureAnonKey();
  const session = await prisma.workspaceSession.create({
    data: {
      ownerId,
      anonKey,
    },
  });
  const payload = CreateSessionResponseSchema.parse({ sessionId: session.id });
  return Response.json(payload);
}
