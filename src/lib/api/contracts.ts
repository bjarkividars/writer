import type { JSONContent } from "@tiptap/react";
import { z } from "zod";

export const SessionIdSchema = z.string().min(1);

export const DocumentContentSchema = z.custom<JSONContent>();

export const ChatMessageSchema = z
  .object({
    id: z.string(),
    role: z.enum(["user", "model"]),
    content: z.string(),
    createdAt: z.string(),
  })
  .strict();

export const CreateSessionResponseSchema = z
  .object({
    sessionId: SessionIdSchema,
  })
  .strict();

export const GetSessionResponseSchema = z
  .object({
    sessionId: SessionIdSchema,
    document: DocumentContentSchema.nullable(),
    messages: z.array(ChatMessageSchema),
  })
  .strict();

export const SaveDocumentRequestSchema = z
  .object({
    content: DocumentContentSchema,
  })
  .strict();

export const SaveDocumentResponseSchema = z
  .object({
    sessionId: SessionIdSchema,
    updatedAt: z.string(),
  })
  .strict();

export const AppendMessageRequestSchema = z
  .object({
    role: z.enum(["user", "model"]),
    content: z.string().min(1),
  })
  .strict();

export const AppendMessageResponseSchema = ChatMessageSchema;

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;
export type GetSessionResponse = z.infer<typeof GetSessionResponseSchema>;
export type SaveDocumentRequest = z.infer<typeof SaveDocumentRequestSchema>;
export type SaveDocumentResponse = z.infer<typeof SaveDocumentResponseSchema>;
export type AppendMessageRequest = z.infer<typeof AppendMessageRequestSchema>;
export type AppendMessageResponse = z.infer<typeof AppendMessageResponseSchema>;
