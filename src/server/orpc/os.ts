import { implement } from "@orpc/server";
import { apiContract } from "@/lib/orpc/contract";
import type { IdentityContext } from "@/server/orpc/context";

export const os = implement(apiContract).$context<IdentityContext>();
