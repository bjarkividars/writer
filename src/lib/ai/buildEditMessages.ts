import type { FilePart, ModelMessage, TextPart } from "ai";
import type { BlockItem } from "@/lib/ai/schemas";
import { getObjectBase64 } from "@/lib/s3";
import { EDIT_SYSTEM_PROMPT } from "@/lib/ai/editSystemPrompt";

type MessagePart = TextPart | FilePart;

export type ChatHistoryMessage = {
  role: "user" | "model";
  content: string;
  attachments: {
    bucket: string;
    key: string;
    mimeType: string;
    size: number;
  }[];
};

type AttachmentInput = {
  bucket: string;
  key: string;
  mimeType: string;
  size: number;
  originalName?: string | null;
};

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const createTextPart = (text: string): TextPart => ({ type: "text", text });
const createFilePart = (input: {
  data: string;
  mediaType: string;
}): FilePart => ({
  type: "file",
  data: input.data,
  mediaType: input.mediaType,
});

/**
 * Build a concise message list for the AI model
 */
export async function buildEditMessages(params: {
  instruction: string;
  mode: "inline" | "chat";
  selection?: { from: number; to: number; text: string };
  items: BlockItem[];
  chatHistory: ChatHistoryMessage[];
  attachments?: AttachmentInput[];
}): Promise<ModelMessage[]> {
  const { instruction, mode, selection, items, chatHistory } = params;
  const attachments = params.attachments ?? [];

  const itemsText = items
    .map((item) => {
      const typeLabel =
        item.blockType === "heading"
          ? `heading-${item.headingLevel ?? 1}`
          : item.blockType === "bulletList"
            ? "bullet"
            : item.blockType === "orderedList"
              ? "numbered"
              : "paragraph";
      return `${item.id} [${typeLabel}]: "${item.text}"`;
    })
    .join("\n");
  const attachmentLabels = attachments.length
    ? attachments
        .map((attachment) => attachment.originalName ?? attachment.key)
        .join(", ")
    : "none";
  const attachmentNote = attachments.length
    ? "IMPORTANT: A file is attached to this message. Use it. Do not ask the user to attach or paste it."
    : "";

  const userPrompt = `**USER INSTRUCTION:**
${instruction}

**MODE:** ${mode}

**ATTACHED FILES (CURRENT REQUEST):** ${attachmentLabels}
${attachmentNote ? `\n${attachmentNote}\n` : ""}

${selection ? `**CURRENT SELECTION:**\n"${selection.text}"\n` : ""}**AVAILABLE ITEMS:**
${itemsText}`;

  const historyMessages = await Promise.all(
    chatHistory.map(async (message): Promise<ModelMessage> => {
      if (message.role !== "user" || message.attachments.length === 0) {
        if (message.role === "model") {
          return { role: "assistant", content: message.content };
        }
        return { role: "user", content: message.content };
      }

      const parts: MessagePart[] = [];
      const trimmedContent = message.content.trim();
      if (trimmedContent.length > 0) {
        parts.push(createTextPart(message.content));
      }

      const pdfAttachments = message.attachments.filter(
        (attachment) => attachment.mimeType === "application/pdf"
      );

      const base64Files = await Promise.all(
        pdfAttachments.map(async (attachment) => {
          const bucket = attachment.bucket || process.env.S3_BUCKET_NAME || "";
          if (!bucket) {
            throw new Error("Missing S3 bucket for attachment.");
          }

          const base64 = await getObjectBase64({
            bucket,
            key: attachment.key,
            maxBytes: MAX_ATTACHMENT_BYTES,
          });

          return createFilePart({
            data: `data:${attachment.mimeType};base64,${base64}`,
            mediaType: attachment.mimeType,
          });
        })
      );

      parts.push(...base64Files);

      return { role: "user", content: parts.length ? parts : message.content };
    })
  );

  const instructionMessage = attachments.length
    ? {
        role: "user" as const,
        content: [
          createTextPart(userPrompt),
          ...(await Promise.all(
            attachments.map(async (attachment) => {
              const base64 = await getObjectBase64({
                bucket: attachment.bucket,
                key: attachment.key,
                maxBytes: MAX_ATTACHMENT_BYTES,
              });

              return createFilePart({
                data: `data:${attachment.mimeType};base64,${base64}`,
                mediaType: attachment.mimeType,
              });
            })
          )),
        ] as MessagePart[],
      }
    : { role: "user" as const, content: userPrompt };

  const today = new Date().toISOString().slice(0, 10);

  return [
    { role: "system", content: `Today is ${today}.\n${EDIT_SYSTEM_PROMPT}` },
    ...historyMessages,
    instructionMessage,
  ];
}
