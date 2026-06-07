import { HTTPException } from "hono/http-exception";
import type { AppBindings } from "../server";
import type { MiddlewareHandler } from "hono";

export const requireUser: MiddlewareHandler<AppBindings> = async (c, next) => {
  const user = c.get("user");

  if (!user) {
    throw new HTTPException(401, {
      message: "Authentication required",
    });
  }

  await next();
};
