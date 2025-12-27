-- CreateTable
CREATE TABLE "workspace_session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" TEXT,
    "ownerId" UUID,

    CONSTRAINT "workspace_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "sessionId" UUID NOT NULL,
    "content" JSONB NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_message_sessionId_createdAt_idx" ON "chat_message"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "workspace_session" ADD CONSTRAINT "workspace_session_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "neon_auth"."user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "workspace_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "workspace_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
