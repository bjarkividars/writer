import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";
import type { ApiInputs, ApiOutputs } from "@/lib/orpc/contract";

type MutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables, unknown>,
  "mutationFn" | "mutationKey"
>;

type AppendMessageInput = ApiInputs["messages"]["append"];
type AppendMessageOutput = ApiOutputs["messages"]["append"];

type SelectOptionInput = ApiInputs["messages"]["selectOption"];
type SelectOptionOutput = ApiOutputs["messages"]["selectOption"];

type UploadAttachmentInput = ApiInputs["messages"]["uploadAttachment"];
type UploadAttachmentOutput = ApiOutputs["messages"]["uploadAttachment"];

export function useAppendMessageMutation(
  options?: MutationOptions<AppendMessageOutput, AppendMessageInput>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...orpc.messages.append.mutationOptions(),
    ...rest,
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({
        queryKey: orpc.session.get.queryKey({
          input: { sessionId: variables.sessionId },
        }),
      });
      await onSuccess?.(data, variables, context, mutationContext);
    },
  });
}

export function useSelectOptionMutation(
  options?: MutationOptions<SelectOptionOutput, SelectOptionInput>
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...orpc.messages.selectOption.mutationOptions(),
    ...rest,
    onSuccess: async (data, variables, context, mutationContext) => {
      await queryClient.invalidateQueries({
        queryKey: orpc.session.get.queryKey({
          input: { sessionId: variables.sessionId },
        }),
      });
      await onSuccess?.(data, variables, context, mutationContext);
    },
  });
}

export function useUploadAttachmentMutation(
  options?: MutationOptions<UploadAttachmentOutput, UploadAttachmentInput>
) {
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...orpc.messages.uploadAttachment.mutationOptions(),
    ...rest,
    onSuccess: async (data, variables, context, mutationContext) => {
      await onSuccess?.(data, variables, context, mutationContext);
    },
  });
}
