/*
  Warnings:

  - A unique constraint covering the columns `[selectedOptionId]` on the table `chat_message` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "chat_message" ADD COLUMN     "selectedOptionId" UUID;

-- CreateTable
CREATE TABLE "chat_message_option" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "messageId" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_option_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_message_option_messageId_idx" ON "chat_message_option"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_message_option_messageId_index_key" ON "chat_message_option"("messageId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "chat_message_selectedOptionId_key" ON "chat_message"("selectedOptionId");

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "chat_message_option"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_message_option" ADD CONSTRAINT "chat_message_option_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
