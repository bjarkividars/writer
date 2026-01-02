import { ORPCError } from "@orpc/server";
import { ServiceError } from "@/server/services/errors";

export async function handleServiceError<T>(
  handler: () => Promise<T>
): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ServiceError) {
      throw new ORPCError(error.code, { message: error.message });
    }
    throw error;
  }
}
