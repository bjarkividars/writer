import { os } from "@/server/orpc/os";
import { messagesRouter } from "@/server/orpc/routers/messages";
import { sessionRouter } from "@/server/orpc/routers/session";
import { sessionsRouter } from "@/server/orpc/routers/sessions";

export const router = os.router({
  sessions: sessionsRouter,
  session: sessionRouter,
  messages: messagesRouter,
});
