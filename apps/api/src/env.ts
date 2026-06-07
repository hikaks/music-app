import "dotenv/config";

export interface ApiEnv {
  nodeEnv: string;
  port: number;
  betterAuthSecret: string;
  betterAuthUrl: string;
  appPublicUrl: string;
  corsOrigins: string[];
}

export function loadEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  const port = Number(env.PORT ?? 4000);
  const nodeEnv = env.NODE_ENV ?? "development";

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${env.PORT}`);
  }

  if (nodeEnv === "production" && !env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is required in production");
  }

  const betterAuthUrl = env.BETTER_AUTH_URL ?? `http://localhost:${port}`;
  const appPublicUrl = env.APP_PUBLIC_URL ?? "http://localhost:8081";
  const configuredOrigins = env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];

  return {
    nodeEnv,
    port,
    betterAuthSecret:
      env.BETTER_AUTH_SECRET ?? "harmonix-mobile-local-dev-secret-change-before-production",
    betterAuthUrl,
    appPublicUrl,
    corsOrigins: Array.from(
      new Set([
        appPublicUrl,
        betterAuthUrl,
        "http://localhost:8081",
        "http://localhost:19006",
        "http://127.0.0.1:8081",
        ...configuredOrigins,
      ]),
    ),
  };
}
