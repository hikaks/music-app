import { Hono } from "hono";
import { cors } from "hono/cors";
import type { HealthResponse } from "@harmonix-mobile/shared";
import { auth } from "./auth/auth";
import type { ApiEnv } from "./env";
import { errorHandler, notFoundHandler } from "./middleware/errors";
import { attachSession } from "./middleware/session";
import { requestLogger } from "./middleware/requestLogger";
import { userRoutes } from "./modules/users/routes";

export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session.session;

export type AppBindings = {
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
};

export function createApp(env: ApiEnv): Hono<AppBindings> {
  const app = new Hono<AppBindings>();

  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  app.use("*", requestLogger(env));
  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return null;
        return env.corsOrigins.includes(origin) ? origin : null;
      },
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Length", "Set-Cookie"],
      credentials: true,
      maxAge: 600,
    }),
  );
  app.use("*", attachSession);

  app.get("/health", (c) => {
    const payload: HealthResponse = {
      status: "ok",
      service: "harmonix-mobile-api",
      timestamp: new Date().toISOString(),
    };

    return c.json(payload);
  });

  app.on(["GET", "POST"], "/auth/*", (c) => {
    return auth.handler(c.req.raw);
  });

  app.route("/v1", userRoutes);

  return app;
}
