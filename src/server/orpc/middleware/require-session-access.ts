import { ORPCError } from "@orpc/server";
import { prisma } from "@/lib/prisma";
import { canAccessSession } from "@/lib/session-auth";
import { os } from "@/server/orpc/os";
import type { IdentityContext } from "@/server/orpc/context";

type NeedsSessionId = { sessionId: string };

export const requireSessionAccess = os.middleware<
  IdentityContext,
  NeedsSessionId
>(async ({ context, next }, input) => {
  const session = await prisma.workspaceSession.findUnique({
    where: { id: input.sessionId },
    select: { id: true, ownerId: true, anonKey: true },
  });

  if (!session) {
    throw new ORPCError("NOT_FOUND", { message: "Session not found" });
  }

  const allowed = canAccessSession({
    sessionOwnerId: session.ownerId,
    sessionAnonKey: session.anonKey,
    ownerId: context.ownerId,
    anonKey: context.anonKey,
  });

  if (!allowed) {
    throw new ORPCError("FORBIDDEN", { message: "Forbidden" });
  }

  return next({ context });
});
