import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import type { ApiInputs, ApiOutputs } from "@/lib/orpc/contract";

type MutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables, unknown>,
  "mutationFn" | "mutationKey"
>;

type CreateSessionInput = ApiInputs["session"]["create"];
type CreateSessionOutput = ApiOutputs["session"]["create"];

type UpdateSessionInput = ApiInputs["session"]["update"];
type UpdateSessionOutput = ApiOutputs["session"]["update"];

type DeleteSessionInput = ApiInputs["session"]["delete"];
type DeleteSessionOutput = ApiOutputs["session"]["delete"];

type GenerateTitleInput = ApiInputs["session"]["generateTitle"];
type GenerateTitleOutput = ApiOutputs["session"]["generateTitle"];

type SaveDocumentInput = ApiInputs["session"]["saveDocument"];
type SaveDocumentOutput = ApiOutputs["session"]["saveDocument"];

export function useCreateSessionMutation(
  options?: MutationOptions<CreateSessionOutput, CreateSessionInput>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...orpc.session.create.mutationOptions(),
    ...rest,
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({
        queryKey: orpc.sessions.list.queryKey(),
      });
      await onSuccess?.(data, variables, context, mutationContext);
    },
  });
}

export function useUpdateSessionMutation(
  options?: MutationOptions<UpdateSessionOutput, UpdateSessionInput>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...orpc.session.update.mutationOptions(),
    ...rest,
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({
        queryKey: orpc.sessions.list.queryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: orpc.session.get.queryKey({
          input: { sessionId: variables.sessionId },
        }),
      });
      await onSuccess?.(data, variables, context, mutationContext);
    },
  });
}

export function useDeleteSessionMutation(
  options?: MutationOptions<DeleteSessionOutput, DeleteSessionInput>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...orpc.session.delete.mutationOptions(),
    ...rest,
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({
        queryKey: orpc.sessions.list.queryKey(),
      });
      queryClient.removeQueries({
        queryKey: orpc.session.get.queryKey({
          input: { sessionId: variables.sessionId },
        }),
      });
      await onSuccess?.(data, variables, context, mutationContext);
    },
  });
}

export function useGenerateTitleMutation(
  options?: MutationOptions<GenerateTitleOutput, GenerateTitleInput>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...orpc.session.generateTitle.mutationOptions(),
    ...rest,
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({
        queryKey: orpc.sessions.list.queryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: orpc.session.get.queryKey({
          input: { sessionId: variables.sessionId },
        }),
      });
      await onSuccess?.(data, variables, context, mutationContext);
    },
  });
}

export function useSaveDocumentMutation(
  options?: MutationOptions<SaveDocumentOutput, SaveDocumentInput>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...orpc.session.saveDocument.mutationOptions(),
    ...rest,
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({
        queryKey: orpc.sessions.list.queryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: orpc.session.get.queryKey({
          input: { sessionId: variables.sessionId },
        }),
      });
      await onSuccess?.(data, variables, context, mutationContext);
    },
  });
}
