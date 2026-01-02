import { RPCHandler } from "@orpc/server/fetch";
import { router } from "@/server/orpc/router";

const handler = new RPCHandler(router);

async function handleRequest(request: Request) {
  const result = await handler.handle(request, { prefix: "/rpc" });
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
