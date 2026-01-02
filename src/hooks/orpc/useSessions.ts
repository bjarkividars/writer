import { useCallback } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";

export function useSessionsQuery() {
  return useQuery(orpc.sessions.list.queryOptions());
}

export function useSessionQuery(input: { sessionId: string } | null, enabled: boolean) {
  return useQuery(
    orpc.session.get.queryOptions({
      input: input ?? skipToken,
      enabled,
    })
  );
}

export function useRefreshSessions() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: orpc.sessions.list.queryKey(),
    });
  }, [queryClient]);
}
