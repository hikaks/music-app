import { auth } from "../auth/auth";
import type { AppBindings } from "../server";
import type { MiddlewareHandler } from "hono";

export const attachSession: MiddlewareHandler<AppBindings> = async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
};
