import { prisma } from "@/lib/prisma";
import { getOwnerId, getAnonKey } from "@/lib/session-auth";
import { GetSessionsResponseSchema } from "@/lib/api/contracts";

/**
 * GET /api/sessions
 *
 * Returns all workspace sessions for the current user (authenticated or anonymous)
 */
export async function GET() {
  try {
    const ownerId = await getOwnerId();
    const anonKey = ownerId ? null : await getAnonKey();

    const sessions = await prisma.workspaceSession.findMany({
      where: ownerId
        ? { ownerId }
        : anonKey
        ? { anonKey, ownerId: null }
        : { id: "impossible" }, // No sessions if no auth
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 50, // Limit for initial implementation
    });

    const payload = GetSessionsResponseSchema.parse({
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    });

    return Response.json(payload);
  } catch (error) {
    console.error("[GET /api/sessions] Error:", error);
    return Response.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
