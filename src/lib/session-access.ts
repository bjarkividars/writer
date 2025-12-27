import { prisma } from "@/lib/prisma";
import { canAccessSession, getAnonKey, getOwnerId } from "@/lib/session-auth";

export type SessionAccessResult =
  | { ok: true; session: { id: string; ownerId: string | null; anonKey: string | null } }
  | { ok: false; status: 404 | 403; error: string };

export async function requireSessionAccess(
  sessionId: string
): Promise<SessionAccessResult> {
  const ownerId = await getOwnerId();
  const anonKey = await getAnonKey();
  const session = await prisma.workspaceSession.findUnique({
    where: { id: sessionId },
    select: { id: true, ownerId: true, anonKey: true },
  });

  if (!session) {
    return { ok: false, status: 404, error: "Session not found" };
  }

  const allowed = canAccessSession({
    sessionOwnerId: session.ownerId,
    sessionAnonKey: session.anonKey,
    ownerId,
    anonKey,
  });

  if (!allowed) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, session };
}
