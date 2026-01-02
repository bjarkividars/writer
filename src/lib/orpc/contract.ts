import { oc, type InferContractRouterInputs, type InferContractRouterOutputs } from "@orpc/contract";
import { z } from "zod";
import {
  AppendMessageResponseSchema,
  ChatOptionInputSchema,
  CreateSessionResponseSchema,
  DeleteSessionResponseSchema,
  DocumentContentSchema,
  GenerateSessionTitleResponseSchema,
  GetSessionResponseSchema,
  GetSessionsResponseSchema,
  MessageIdSchema,
  SaveDocumentResponseSchema,
  SelectMessageOptionResponseSchema,
  SessionIdSchema,
  UpdateSessionResponseSchema,
} from "../api/schemas";

const EmptyInputSchema = z.undefined();

export const apiContract = {
  sessions: {
    list: oc
      .route({ method: "GET", path: "/api/sessions" })
      .input(EmptyInputSchema)
      .output(GetSessionsResponseSchema),
  },
  session: {
    create: oc
      .route({ method: "POST", path: "/api/session" })
      .input(EmptyInputSchema)
      .output(CreateSessionResponseSchema),
    get: oc
      .route({ method: "GET", path: "/api/session/:sessionId" })
      .input(z.object({ sessionId: SessionIdSchema }).strict())
      .output(GetSessionResponseSchema),
    saveDocument: oc
      .route({ method: "PUT", path: "/api/session/:sessionId" })
      .input(
        z
          .object({
            sessionId: SessionIdSchema,
            content: DocumentContentSchema,
          })
          .strict()
      )
      .output(SaveDocumentResponseSchema),
    update: oc
      .route({ method: "PATCH", path: "/api/session/:sessionId" })
      .input(
        z
          .object({
            sessionId: SessionIdSchema,
            title: z.string().min(1),
          })
          .strict()
      )
      .output(UpdateSessionResponseSchema),
    delete: oc
      .route({ method: "DELETE", path: "/api/session/:sessionId" })
      .input(z.object({ sessionId: SessionIdSchema }).strict())
      .output(DeleteSessionResponseSchema),
    generateTitle: oc
      .route({ method: "POST", path: "/api/session/:sessionId/title" })
      .input(z.object({ sessionId: SessionIdSchema }).strict())
      .output(GenerateSessionTitleResponseSchema),
  },
  messages: {
    append: oc
      .route({ method: "POST", path: "/api/session/:sessionId/messages" })
      .input(
        z
          .object({
            sessionId: SessionIdSchema,
            role: z.enum(["user", "model"]),
            content: z.string().min(1),
            options: z.array(ChatOptionInputSchema).optional(),
          })
          .strict()
      )
      .output(AppendMessageResponseSchema),
    selectOption: oc
      .route({
        method: "PATCH",
        path: "/api/session/:sessionId/messages/:messageId/select-option",
      })
      .input(
        z
          .object({
            sessionId: SessionIdSchema,
            messageId: MessageIdSchema,
            index: z.number().int().min(0),
          })
          .strict()
      )
      .output(SelectMessageOptionResponseSchema),
  },
};

export type ApiContract = typeof apiContract;
export type ApiInputs = InferContractRouterInputs<ApiContract>;
export type ApiOutputs = InferContractRouterOutputs<ApiContract>;
