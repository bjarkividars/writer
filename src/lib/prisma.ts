import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

export const prisma =
  globalForPrisma.prisma ? globalForPrisma.prisma as unknown as PrismaClient :
    new PrismaClient({
      adapter,
      log: ["error"],
    });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
