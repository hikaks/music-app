import type { MusicSourceId } from "./source.types";

export interface Artist {
  id: string;
  name: string;
  source: MusicSourceId | string;
  imageUrl?: string;
  externalUrl?: string;
}

export interface Album {
  id: string;
  title: string;
  artists: Artist[];
  source: MusicSourceId | string;
  artworkUrl?: string;
  releaseDate?: string;
  trackCount?: number;
  externalUrl?: string;
}

export interface Track {
  id: string;
  source: MusicSourceId | string;
  sourceId: string;
  title: string;
  artists: Artist[];
  durationMs: number;
  isPlayable: boolean;
  album?: Album;
  artworkUrl?: string;
  isrc?: string;
  externalUrl?: string;
  previewUrl?: string;
  playbackKind?: PlaybackKind;
  meta?: Record<string, unknown>;
}

export interface Playlist {
  id: string;
  source: MusicSourceId | string;
  name: string;
  trackCount: number;
  description?: string;
  ownerName?: string;
  artworkUrl?: string;
  externalUrl?: string;
}

export interface SearchResult {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

export type SourceProtocol = "http" | "file" | "spotify-sdk" | "youtube" | "external" | "custom";

export type PlaybackKind =
  | "direct-stream"
  | "preview"
  | "local-file"
  | "external"
  | "remote-control"
  | "unknown";

export interface StreamInfo {
  url: string;
  protocol: SourceProtocol;
  playbackKind: PlaybackKind;
  expiresAt?: string;
  requiresProxy?: boolean;
  headers?: Record<string, string>;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  types?: Array<"track" | "album" | "artist" | "playlist">;
}
