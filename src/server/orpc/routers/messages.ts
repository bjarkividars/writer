import { os } from "@/server/orpc/os";
import { withIdentity } from "@/server/orpc/middleware/identity";
import { requireSessionAccess } from "@/server/orpc/middleware/require-session-access";
import { handleServiceError } from "@/server/orpc/utils/handle-service-error";
import { appendMessage, selectMessageOption } from "@/server/services/messages";

export const messagesRouter = {
  append: os.messages.append
    .use(withIdentity)
    .use(requireSessionAccess)
    .handler(async ({ input }) =>
      handleServiceError(() =>
        appendMessage({
          sessionId: input.sessionId,
          role: input.role,
          content: input.content,
          options: input.options,
        })
      )
    ),
  selectOption: os.messages.selectOption
    .use(withIdentity)
    .use(requireSessionAccess)
    .handler(async ({ input }) =>
      handleServiceError(() =>
        selectMessageOption({
          sessionId: input.sessionId,
          messageId: input.messageId,
          index: input.index,
        })
      )
    ),
};
