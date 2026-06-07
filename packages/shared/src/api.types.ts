import type { MusicSourceId, SourceRegistration } from "./source.types";
import type { SearchResult, StreamInfo, Track } from "./music.types";

export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface MeResponse {
  id: string;
  email: string;
  displayName?: string;
  imageUrl?: string;
}

export interface SourceSearchResponse {
  sourceId: MusicSourceId | string;
  result: SearchResult;
  error?: ApiError;
}

export interface ResolvePlaybackRequest {
  source: MusicSourceId | string;
  sourceId: string;
  client: {
    platform: "ios" | "android" | "web";
    supports: string[];
  };
}

export interface ResolvePlaybackResponse {
  track?: Track;
  stream: StreamInfo;
}

export interface SourcesResponse {
  sources: SourceRegistration[];
}
