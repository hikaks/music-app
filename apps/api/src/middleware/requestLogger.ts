import type { ApiEnv } from "../env";
import type { AppBindings } from "../server";
import type { MiddlewareHandler } from "hono";

export function requestLogger(env: ApiEnv): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    if (env.nodeEnv === "test") {
      await next();
      return;
    }

    const startedAt = Date.now();
    await next();
    const elapsedMs = Date.now() - startedAt;
    console.info(`[api] ${c.req.method} ${c.req.path} ${c.res.status} ${elapsedMs}ms`);
  };
}
