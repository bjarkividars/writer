-- AlterTable
ALTER TABLE "workspace_session" ADD COLUMN     "anonKey" TEXT;

-- CreateIndex
CREATE INDEX "workspace_session_anonKey_idx" ON "workspace_session"("anonKey");

-- CreateIndex
CREATE INDEX "workspace_session_ownerId_idx" ON "workspace_session"("ownerId");
