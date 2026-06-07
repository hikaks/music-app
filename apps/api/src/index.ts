import { serve } from "@hono/node-server";
import { loadEnv } from "./env";
import { createApp } from "./server";

const env = loadEnv();

export const app = createApp(env);

if (process.env.NODE_ENV !== "test") {
  serve(
    {
      fetch: app.fetch,
      port: env.port,
    },
    (info) => {
      console.info(`[api] Harmonix mobile API listening on http://localhost:${info.port}`);
    },
  );
}
