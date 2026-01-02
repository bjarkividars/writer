# Plan

- [x] Inventory current client API usage and map endpoints into an oRPC contract definition.
- [x] Add oRPC contract definitions + TanStack Query setup (QueryClient provider).
- [x] Build query/mutation hooks for all non-streaming endpoints using the oRPC contract types.
- [x] Replace direct fetch calls in components/hooks with query/mutation hooks.
- [x] Align cache updates/invalidations for sessions, session detail, messages, and title; keep autosave semantics intact.

## 1) Contract-first (shared)

`packages/api-contract/src/contract.ts`

```ts
import { oc } from "@orpc/contract";
import { z } from "zod";

export const contract = oc.router({
  planet: oc.router({
    find: oc
      .input(z.object({ id: z.number() }))
      .output(z.object({ id: z.number(), name: z.string() })),

    create: oc
      .input(z.object({ name: z.string() }))
      .output(z.object({ id: z.number(), name: z.string() })),
  }),
});

export type Contract = typeof contract;
```

---

## 2) Server implementation

`apps/web/src/server/router.ts`

```ts
import { implement } from "@orpc/server";
import { contract } from "api-contract";

export const router = implement(contract, {
  planet: {
    find: async ({ input }) => ({ id: input.id, name: "Earth" }),
    create: async ({ input }) => ({ id: Date.now(), name: input.name }),
  },
});
```

---

## 3) Next.js App Router route handler

Create a catch-all route (example uses `/rpc` as the prefix).

`apps/web/app/rpc/[[...rest]]/route.ts`

```ts
import { RPCHandler } from "@orpc/server/fetch";
import { router } from "@/server/router";

const handler = new RPCHandler(router);

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: "/rpc",
    context: {}, // optionally build per-request context here
  });

  return response ?? new Response("Not found", { status: 404 });
}

export const GET = handleRequest;
export const POST = handleRequest;
```

This is the documented Next.js App Router adapter pattern (`app/rpc/[[...rest]]/route.ts` + `RPCHandler`). ([oRPC][2])

---

## 4) Client + TanStack Query utils

`apps/web/src/lib/orpc.ts`

```ts
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

const link = new RPCLink({
  url: `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/rpc`,
  headers: async () => {
    if (typeof window !== "undefined") return {};
    const { headers } = await import("next/headers");
    return await headers();
  },
});

export const client = createORPCClient(link);
export const orpc = createTanstackQueryUtils(client);
```

The Next.js adapter docs show configuring `RPCLink` with `next/headers` so it works on server + browser. ([oRPC][2])
TanStack Query integration uses `createTanstackQueryUtils(client)` and exposes `.queryOptions` / `.mutationOptions`. ([oRPC][1])

---

## 5) React Query provider (client component)

`apps/web/app/providers.tsx`

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
```

Wrap in `app/layout.tsx`:

```tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
```

---

## 6) Use it in components

### Query

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export function Planet({ id }: { id: number }) {
  const q = useQuery(
    orpc.planet.find.queryOptions({
      input: { id },
    })
  );

  if (q.isLoading) return <div>Loading…</div>;
  if (q.error) return <div>Error</div>;
  return <div>{q.data.name}</div>;
}
```

`.queryOptions` usage is exactly how the integration docs show it. ([oRPC][1])

### Mutation + invalidation

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export function CreatePlanet() {
  const qc = useQueryClient();

  const m = useMutation(
    orpc.planet.create.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: orpc.planet.key() });
      },
    })
  );

  return (
    <button onClick={() => m.mutate({ name: "Mars" })}>
      Create
    </button>
  );
}
```

`.mutationOptions` and `.key()` for invalidation are documented. ([oRPC][1])
