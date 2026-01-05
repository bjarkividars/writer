-- CreateTable
CREATE TABLE "chat_message_attachment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "messageId" UUID NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "originalName" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_message_attachment_messageId_idx" ON "chat_message_attachment"("messageId");

-- AddForeignKey
ALTER TABLE "chat_message_attachment" ADD CONSTRAINT "chat_message_attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
