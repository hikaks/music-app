import { HTTPException } from "hono/http-exception";
import type { ErrorHandler, NotFoundHandler } from "hono";
import type { AppBindings } from "../server";

export const errorHandler: ErrorHandler<AppBindings> = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          code: `HTTP_${err.status}`,
          message: err.message,
        },
      },
      err.status,
    );
  }

  console.error("[api] Unhandled error:", err);

  return c.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    },
    500,
  );
};

export const notFoundHandler: NotFoundHandler<AppBindings> = (c) => {
  return c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    },
    404,
  );
};
