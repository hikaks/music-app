import { z } from "zod";
import { MUSIC_SOURCE_IDS } from "./source.types";

export const musicSourceIdSchema = z.enum(MUSIC_SOURCE_IDS);

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(160),
  sources: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const resolvePlaybackRequestSchema = z.object({
  source: z.string().min(1),
  sourceId: z.string().min(1),
  client: z.object({
    platform: z.enum(["ios", "android", "web"]),
    supports: z.array(z.string()).default([]),
  }),
});

export const playlistCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});
