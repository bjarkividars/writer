import type { JSONContent } from "@tiptap/react";
import { z } from "zod";

export const SessionIdSchema = z.string().min(1);
export const MessageIdSchema = z.string().min(1);

export const DocumentContentSchema = z.custom<JSONContent>();

export const ChatOptionSchema = z
  .object({
    id: z.string(),
    index: z.number().int().min(0),
    title: z.string(),
    content: z.string(),
  })
  .strict();

export const ChatOptionInputSchema = z
  .object({
    index: z.number().int().min(0),
    title: z.string(),
    content: z.string(),
  })
  .strict();

export const ChatMessageSchema = z
  .object({
    id: z.string(),
    role: z.enum(["user", "model"]),
    content: z.string(),
    createdAt: z.string(),
    options: z.array(ChatOptionSchema),
    selectedOptionId: z.string().nullable().optional(),
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
    options: z.array(ChatOptionInputSchema).optional(),
  })
  .strict();

export const AppendMessageResponseSchema = ChatMessageSchema;

export const SelectMessageOptionRequestSchema = z
  .object({
    index: z.number().int().min(0),
  })
  .strict();

export const SelectMessageOptionResponseSchema = ChatMessageSchema;

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatOption = z.infer<typeof ChatOptionSchema>;
export type ChatOptionInput = z.infer<typeof ChatOptionInputSchema>;
export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;
export type GetSessionResponse = z.infer<typeof GetSessionResponseSchema>;
export type SaveDocumentRequest = z.infer<typeof SaveDocumentRequestSchema>;
export type SaveDocumentResponse = z.infer<typeof SaveDocumentResponseSchema>;
export type AppendMessageRequest = z.infer<typeof AppendMessageRequestSchema>;
export type AppendMessageResponse = z.infer<typeof AppendMessageResponseSchema>;
export type SelectMessageOptionRequest = z.infer<
  typeof SelectMessageOptionRequestSchema
>;
export type SelectMessageOptionResponse = z.infer<
  typeof SelectMessageOptionResponseSchema
>;
