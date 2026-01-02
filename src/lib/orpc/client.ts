import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { inferRPCMethodFromContractRouter, type ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { apiContract } from "@/lib/orpc/contract";

const link = new RPCLink({
  url: `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/rpc`, method: inferRPCMethodFromContractRouter(apiContract),
});

export const orpcClient: ContractRouterClient<typeof apiContract> =
  createORPCClient(link);

export const orpc = createTanstackQueryUtils(orpcClient);
