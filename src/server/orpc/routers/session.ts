import { os } from "@/server/orpc/os";
import { withIdentity } from "@/server/orpc/middleware/identity";
import { requireSessionAccess } from "@/server/orpc/middleware/require-session-access";
import { handleServiceError } from "@/server/orpc/utils/handle-service-error";
import {
  createSession,
  deleteSession,
  generateSessionTitle,
  getSessionDetails,
  saveSessionDocument,
  updateSessionTitle,
} from "@/server/services/sessions";

export const sessionRouter = {
  create: os.session.create
    .use(withIdentity)
    .handler(async ({ context }) =>
      handleServiceError(() =>
        createSession({ ownerId: context.ownerId, anonKey: context.anonKey })
      )
    ),
  get: os.session.get
    .use(withIdentity)
    .use(requireSessionAccess)
    .handler(async ({ input }) =>
      handleServiceError(() => getSessionDetails(input.sessionId))
    ),
  saveDocument: os.session.saveDocument
    .use(withIdentity)
    .use(requireSessionAccess)
    .handler(async ({ input }) =>
      handleServiceError(() =>
        saveSessionDocument({
          sessionId: input.sessionId,
          content: input.content,
        })
      )
    ),
  update: os.session.update
    .use(withIdentity)
    .use(requireSessionAccess)
    .handler(async ({ input }) =>
      handleServiceError(() =>
        updateSessionTitle({
          sessionId: input.sessionId,
          title: input.title,
        })
      )
    ),
  delete: os.session.delete
    .use(withIdentity)
    .use(requireSessionAccess)
    .handler(async ({ input }) =>
      handleServiceError(() => deleteSession(input.sessionId))
    ),
  generateTitle: os.session.generateTitle
    .use(withIdentity)
    .use(requireSessionAccess)
    .handler(async ({ input }) =>
      handleServiceError(() => generateSessionTitle(input.sessionId))
    ),
};
