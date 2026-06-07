import { z } from "zod";

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  imageUrl: z.url().optional(),
  country: z.string().trim().min(2).max(80).optional(),
  locale: z.string().trim().min(2).max(32).optional(),
});

export const deviceCreateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  platform: z.enum(["ios", "android", "web", "unknown"]).default("unknown"),
  pushToken: z.string().trim().min(1).max(512).optional(),
});
