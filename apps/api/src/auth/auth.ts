import { prisma } from "@harmonix-mobile/database";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { loadEnv } from "../env";

const env = loadEnv();

export const auth = betterAuth({
  appName: "Harmonix Mobile",
  baseURL: env.betterAuthUrl,
  secret: env.betterAuthSecret,
  trustedOrigins: env.corsOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
});
