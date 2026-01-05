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

export const AttachmentInputSchema = z
  .object({
    bucket: z.string().min(1),
    key: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.number().int().nonnegative(),
    originalName: z.string().nullable().optional(),
  })
  .strict();

export const ChatMessageSchema = z
  .object({
    id: z.string(),
    role: z.enum(["user", "model"]),
    content: z.string(),
    createdAt: z.string(),
    options: z.array(ChatOptionSchema),
    attachments: z.array(AttachmentInputSchema),
    selectedOptionId: z.string().nullable().optional(),
  })
  .strict();

export const UploadAttachmentRequestSchema = z
  .object({
    sessionId: SessionIdSchema,
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    dataBase64: z.string().min(1),
  })
  .strict();

export const UploadAttachmentResponseSchema = z
  .object({
    attachment: AttachmentInputSchema,
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
    title: z.string().nullable(),
    document: DocumentContentSchema.nullable(),
    messages: z.array(ChatMessageSchema),
  })
  .strict();

export const SaveDocumentResponseSchema = z
  .object({
    sessionId: SessionIdSchema,
    updatedAt: z.string(),
  })
  .strict();

export const AppendMessageResponseSchema = ChatMessageSchema;

export const GenerateSessionTitleResponseSchema = z
  .object({
    title: z.string().nullable(),
  })
  .strict();

export const SelectMessageOptionResponseSchema = ChatMessageSchema;

export const UpdateSessionResponseSchema = z
  .object({
    sessionId: SessionIdSchema,
    title: z.string().nullable(),
    updatedAt: z.string(),
  })
  .strict();

export const DeleteSessionResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .strict();

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatOption = z.infer<typeof ChatOptionSchema>;
export type ChatOptionInput = z.infer<typeof ChatOptionInputSchema>;
export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;
export type GetSessionResponse = z.infer<typeof GetSessionResponseSchema>;
export type SaveDocumentResponse = z.infer<typeof SaveDocumentResponseSchema>;
export type AppendMessageResponse = z.infer<typeof AppendMessageResponseSchema>;
export type AttachmentInput = z.infer<typeof AttachmentInputSchema>;
export type GenerateSessionTitleResponse = z.infer<
  typeof GenerateSessionTitleResponseSchema
>;
export type UploadAttachmentRequest = z.infer<
  typeof UploadAttachmentRequestSchema
>;
export type UploadAttachmentResponse = z.infer<
  typeof UploadAttachmentResponseSchema
>;
export type SelectMessageOptionResponse = z.infer<
  typeof SelectMessageOptionResponseSchema
>;
export type UpdateSessionResponse = z.infer<typeof UpdateSessionResponseSchema>;
export type DeleteSessionResponse = z.infer<typeof DeleteSessionResponseSchema>;

export const SessionSummarySchema = z
  .object({
    id: z.string(),
    title: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export const GetSessionsResponseSchema = z
  .object({
    sessions: z.array(SessionSummarySchema),
  })
  .strict();

export type SessionSummary = z.infer<typeof SessionSummarySchema>;
export type GetSessionsResponse = z.infer<typeof GetSessionsResponseSchema>;
