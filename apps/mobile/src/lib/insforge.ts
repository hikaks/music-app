import { createClient } from "@insforge/sdk";

export const INSFORGE_URL =
  process.env.EXPO_PUBLIC_INSFORGE_URL ?? "https://5izff6gg.ap-southeast.insforge.app";

export const INSFORGE_ANON_KEY = process.env.EXPO_PUBLIC_INSFORGE_ANON_KEY;

export const insforge = createClient({
  baseUrl: INSFORGE_URL,
  ...(INSFORGE_ANON_KEY ? { anonKey: INSFORGE_ANON_KEY } : {}),
});
