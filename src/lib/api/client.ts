import type { z } from "zod";
import {
  AppendMessageRequestSchema,
  AppendMessageResponseSchema,
  CreateSessionResponseSchema,
  GetSessionResponseSchema,
  SaveDocumentRequestSchema,
  SaveDocumentResponseSchema,
} from "./contracts";

async function fetchJson<T>(
  input: RequestInfo,
  init: RequestInit,
  schema: z.ZodType<T>
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const json = await response.json();
  return schema.parse(json);
}

export async function createSession() {
  return fetchJson("/api/session", { method: "POST" }, CreateSessionResponseSchema);
}

export async function getSession(sessionId: string) {
  return fetchJson(
    `/api/session/${sessionId}`,
    { method: "GET" },
    GetSessionResponseSchema
  );
}

export async function saveDocument(sessionId: string, content: unknown) {
  const body = SaveDocumentRequestSchema.parse({ content });
  return fetchJson(
    `/api/session/${sessionId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    SaveDocumentResponseSchema
  );
}

export async function appendMessage(
  sessionId: string,
  role: "user" | "model",
  content: string
) {
  const body = AppendMessageRequestSchema.parse({ role, content });
  return fetchJson(
    `/api/session/${sessionId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    AppendMessageResponseSchema
  );
}
