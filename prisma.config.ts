import "dotenv/config";
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  experimental: {
    externalTables: true,
  },
  tables: {
    external: [
      "neon_auth.account",
      "neon_auth.invitation",
      "neon_auth.jwks",
      "neon_auth.member",
      "neon_auth.organization",
      "neon_auth.project_config",
      "neon_auth.session",
      "neon_auth.user",
      "neon_auth.verification",
    ],
  },
});
