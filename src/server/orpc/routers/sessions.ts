import { os } from "@/server/orpc/os";
import { withIdentity } from "@/server/orpc/middleware/identity";
import { handleServiceError } from "@/server/orpc/utils/handle-service-error";
import { listSessions } from "@/server/services/sessions";

export const sessionsRouter = {
  list: os.sessions.list
    .use(withIdentity)
    .handler(async ({ context }) =>
      handleServiceError(() =>
        listSessions({ ownerId: context.ownerId, anonKey: context.anonKey })
      )
    ),
};
