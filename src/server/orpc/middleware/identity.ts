import { os } from "@/server/orpc/os";
import { ensureAnonKey, getOwnerId } from "@/lib/session-auth";
import type { IdentityContext } from "@/server/orpc/context";

export const withIdentity = os.middleware(async ({ context, next }) => {
  if (context.ownerId !== null || context.anonKey !== null) {
    return next({ context });
  }

  const ownerId = await getOwnerId();
  const anonKey = ownerId ? null : await ensureAnonKey();

  return next({
    context: {
      ownerId,
      anonKey,
    } satisfies IdentityContext,
  });
});
