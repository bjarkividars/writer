import { RPCHandler } from "@orpc/server/fetch";
import { ensureAnonKey, getOwnerId } from "@/lib/session-auth";
import type { IdentityContext } from "@/server/orpc/context";
import { router } from "@/server/orpc/router";

const handler = new RPCHandler(router);

async function handleRequest(request: Request) {
  const ownerId = await getOwnerId();
  const anonKey = ownerId ? null : await ensureAnonKey();
  const context: IdentityContext = { ownerId, anonKey };
  const result = await handler.handle(request, { prefix: "/rpc", context });
  if (!result.matched) {
    return new Response("Not found", { status: 404 });
  }
  return result.response;
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
