"use client";

import { useCallback, useMemo, useState } from "react";
import { useUploadAttachmentMutation } from "@/hooks/orpc/useMessageMutations";
import type { AttachmentInput } from "@/lib/api/schemas";

export type ChatAttachmentItem = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  status: "uploading" | "uploaded" | "error";
  progress: number;
  attachment?: AttachmentInput;
};

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const PDF_MIME = "application/pdf";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readFileAsDataUrl = (
  file: File,
  onProgress: (progress: number) => void
) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read attachment."));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Read failed."));
    reader.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 60);
      onProgress(Math.min(60, Math.max(0, percent)));
    };
    reader.readAsDataURL(file);
  });

export function useChatAttachments(input: {
  ensureSession: () => Promise<string>;
}) {
  const uploadAttachmentMutation = useUploadAttachmentMutation();
  const [attachments, setAttachments] = useState<ChatAttachmentItem[]>([]);

  const updateAttachment = useCallback(
    (id: string, updates: Partial<ChatAttachmentItem>) => {
      setAttachments((prev) =>
        prev.map((attachment) =>
          attachment.id === id ? { ...attachment, ...updates } : attachment
        )
      );
    },
    []
  );

  const selectAttachment = useCallback(
    async (file: File) => {
      if (!file) return;
      const isPdf =
        file.type === PDF_MIME || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf || file.size > MAX_ATTACHMENT_BYTES) {
        setAttachments((prev) => [
          ...prev,
          {
            id: createId(),
            name: file.name,
            size: file.size,
            mimeType: file.type || PDF_MIME,
            status: "error",
            progress: 0,
          },
        ]);
        return;
      }

      const attachmentId = createId();
      setAttachments((prev) => [
        ...prev,
        {
          id: attachmentId,
          name: file.name,
          size: file.size,
          mimeType: file.type || PDF_MIME,
          status: "uploading",
          progress: 0,
        },
      ]);

      try {
        const sessionId = await input.ensureSession();
        const dataBase64 = await readFileAsDataUrl(file, (progress) => {
          updateAttachment(attachmentId, { progress });
        });
        updateAttachment(attachmentId, { progress: 70 });
        const response = await uploadAttachmentMutation.mutateAsync({
          sessionId,
          filename: file.name,
          mimeType: file.type || PDF_MIME,
          dataBase64,
        });
        updateAttachment(attachmentId, {
          status: "uploaded",
          progress: 100,
          attachment: response.attachment,
        });
      } catch (error) {
        console.error("[chat] Failed to upload attachment", error);
        updateAttachment(attachmentId, { status: "error", progress: 0 });
      }
    },
    [input, updateAttachment, uploadAttachmentMutation]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) =>
      prev.filter((attachment) => attachment.id !== id)
    );
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const uploadedAttachments = useMemo(
    () =>
      attachments
        .filter(
          (attachment) =>
            attachment.status === "uploaded" && attachment.attachment
        )
        .map((attachment) => attachment.attachment as AttachmentInput),
    [attachments]
  );

  const isUploading = attachments.some(
    (attachment) => attachment.status === "uploading"
  );

  return {
    attachments,
    uploadedAttachments,
    isUploading,
    selectAttachment,
    removeAttachment,
    clearAttachments,
  };
}
