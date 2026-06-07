import type { SearchOptions, SearchResult, StreamInfo, Track, Playlist } from "./music.types";

export const MUSIC_SOURCE_IDS = [
  "local",
  "spotify",
  "ytmusic",
  "deezer",
  "jamendo",
  "audius",
  "soundcloud",
] as const;

export type MusicSourceId = (typeof MUSIC_SOURCE_IDS)[number];

export interface SourceCapabilities {
  canSearch: boolean;
  canStream: boolean;
  canGetPlaylists: boolean;
  canGetLikedTracks: boolean;
  requiresAuth: boolean;
  supportsFileStreaming: boolean;
  supportsRemoteStreaming: boolean;
  supportsPlaylists: boolean;
}

export interface SourceRegistration {
  id: MusicSourceId | string;
  name: string;
  enabled: boolean;
  authenticated: boolean;
  capabilities: SourceCapabilities;
}

export interface AuthStatus {
  source: MusicSourceId | string;
  authenticated: boolean;
  userName?: string;
  userId?: string;
  expiresAt?: string;
}

export interface MusicSource {
  readonly id: MusicSourceId | string;
  readonly name: string;
  readonly capabilities: SourceCapabilities;

  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  search(query: string, options?: SearchOptions): Promise<SearchResult>;
  getTrack(trackId: string): Promise<Track | null>;
  getStreamUrl(track: Track): Promise<StreamInfo>;
  getUserPlaylists?(): Promise<Playlist[]>;
  getPlaylistTracks?(playlistId: string): Promise<Track[]>;
  getLikedTracks?(): Promise<Track[]>;
  getAuthStatus?(): Promise<AuthStatus>;
}
