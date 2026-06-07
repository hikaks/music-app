import type { Album, Artist, MusicSourceId, SearchOptions, SearchResult, StreamInfo, Track } from "@harmonix-mobile/shared";

type SearchableSourceId = Extract<MusicSourceId, "deezer" | "audius" | "jamendo">;

type SourceSearchStatus = {
  sourceId: SearchableSourceId;
  ok: boolean;
  count: number;
  message?: string;
};

export type MusicSearchResponse = SearchResult & {
  statuses: SourceSearchStatus[];
};

export type SearchableSourceInfo = {
  id: SearchableSourceId;
  name: string;
  description: string;
  enabledByDefault: boolean;
  needsConfig?: boolean;
};

const DEEZER_API = "https://api.deezer.com";
const AUDIUS_API = "https://api.audius.co";
const JAMENDO_API = "https://api.jamendo.com/v3.0";
const JAMENDO_CLIENT_ID = process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID;
const REQUEST_TIMEOUT_MS = 12000;

export const defaultSearchSourceIds: SearchableSourceId[] = ["deezer", "audius"];

export const searchableSources: SearchableSourceInfo[] = [
  {
    id: "deezer",
    name: "Deezer",
    description: "30s previews with album artwork.",
    enabledByDefault: true,
  },
  {
    id: "audius",
    name: "Audius",
    description: "Public creator streams.",
    enabledByDefault: true,
  },
  {
    id: "jamendo",
    name: "Jamendo",
    description: "Creative Commons catalog.",
    enabledByDefault: false,
    needsConfig: !JAMENDO_CLIENT_ID,
  },
];

type DeezerTrack = {
  id: number;
  title: string;
  duration: number;
  preview?: string;
  isrc?: string;
  link?: string;
  share?: string;
  rank?: number;
  artist?: {
    id: number;
    name: string;
    picture_xl?: string;
    picture_big?: string;
    picture_medium?: string;
    picture?: string;
  };
  album?: {
    id: number;
    title: string;
    cover_xl?: string;
    cover_big?: string;
    cover_medium?: string;
    cover?: string;
    release_date?: string;
  };
  type?: string;
};

type AudiusArtwork =
  | string
  | {
      "150x150"?: string;
      "480x480"?: string;
      "1000x1000"?: string;
    }
  | null;

type AudiusTrack = {
  id: string;
  title?: string;
  duration?: number;
  artwork?: AudiusArtwork;
  permalink?: string;
  is_streamable?: boolean;
  genre?: string;
  mood?: string;
  play_count?: number;
  favorite_count?: number;
  stream?: { url?: string };
  user?: {
    id?: string;
    name?: string;
    handle?: string;
  };
};

type JamendoTrack = {
  id: string;
  name: string;
  duration: number;
  artist_id: string;
  artist_name: string;
  album_name: string;
  album_id: string;
  audio?: string;
  image?: string;
  prourl?: string;
  shareurl?: string;
  tags?: Array<{ id: string; name: string }>;
  musicinfo?: Record<string, string | undefined>;
};

function emptyResult(statuses: SourceSearchStatus[] = []): MusicSearchResponse {
  return { tracks: [], albums: [], artists: [], playlists: [], statuses };
}

function isSearchableSourceId(source: string): source is SearchableSourceId {
  return source === "deezer" || source === "audius" || source === "jamendo";
}

export function normalizeSearchSourceIds(sourceIds?: string[]) {
  const normalized = (sourceIds ?? defaultSearchSourceIds).filter(isSearchableSourceId);
  const unique = [...new Set(normalized)];
  return unique.length > 0 ? unique : defaultSearchSourceIds;
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`.trim());
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function artistName(track: Track) {
  return track.artists.map((artist) => artist.name).filter(Boolean).join(", ") || "Unknown Artist";
}

function pickDeezerArtwork(album?: DeezerTrack["album"]) {
  return album?.cover_xl ?? album?.cover_big ?? album?.cover_medium ?? album?.cover;
}

function toDeezerTrack(track: DeezerTrack): Track {
  const artist: Artist = {
    id: `deezer:artist:${track.artist?.id ?? "unknown"}`,
    name: track.artist?.name ?? "Unknown Artist",
    source: "deezer",
    imageUrl:
      track.artist?.picture_xl ?? track.artist?.picture_big ?? track.artist?.picture_medium ?? track.artist?.picture,
  };
  const album: Album | undefined = track.album
    ? {
        id: `deezer:album:${track.album.id}`,
        title: track.album.title,
        source: "deezer",
        artists: [artist],
        artworkUrl: pickDeezerArtwork(track.album),
        releaseDate: track.album.release_date,
      }
    : undefined;

  return {
    id: `deezer:${track.id}`,
    source: "deezer",
    sourceId: String(track.id),
    title: track.title,
    artists: [artist],
    album,
    durationMs: track.duration * 1000,
    artworkUrl: pickDeezerArtwork(track.album),
    isrc: track.isrc,
    externalUrl: track.link,
    isPlayable: Boolean(track.preview),
    previewUrl: track.preview,
    playbackKind: track.preview ? "preview" : "external",
    meta: { preview: track.preview, share: track.share, rank: track.rank },
  };
}

function pickAudiusArtwork(artwork: AudiusArtwork | undefined) {
  if (!artwork) return undefined;
  if (typeof artwork === "string") return artwork;
  return artwork["480x480"] ?? artwork["1000x1000"] ?? artwork["150x150"];
}

function toAudiusTrack(track: AudiusTrack): Track {
  const artist: Artist = {
    id: `audius:artist:${track.user?.id ?? track.user?.handle ?? "unknown"}`,
    name: track.user?.name ?? track.user?.handle ?? "Unknown Artist",
    source: "audius",
    externalUrl: track.user?.handle ? `https://audius.co/${track.user.handle}` : undefined,
  };

  return {
    id: `audius:${track.id}`,
    source: "audius",
    sourceId: track.id,
    title: track.title ?? "Unknown Title",
    artists: [artist],
    durationMs: (track.duration ?? 0) * 1000,
    artworkUrl: pickAudiusArtwork(track.artwork),
    isPlayable: track.is_streamable ?? Boolean(track.stream?.url),
    externalUrl: track.permalink ? `https://audius.co${track.permalink}` : undefined,
    playbackKind: "direct-stream",
    meta: {
      genre: track.genre,
      mood: track.mood,
      playCount: track.play_count,
      favoriteCount: track.favorite_count,
      streamUrl: track.stream?.url,
    },
  };
}

function toJamendoTrack(track: JamendoTrack): Track {
  const artist: Artist = {
    id: `jamendo:artist:${track.artist_id}`,
    name: track.artist_name,
    source: "jamendo",
    externalUrl: `https://www.jamendo.com/artist/${track.artist_id}`,
  };
  const album: Album = {
    id: `jamendo:album:${track.album_id}`,
    title: track.album_name,
    source: "jamendo",
    artists: [artist],
    artworkUrl: track.image,
    externalUrl: `https://www.jamendo.com/album/${track.album_id}`,
  };

  return {
    id: `jamendo:${track.id}`,
    source: "jamendo",
    sourceId: track.id,
    title: track.name,
    artists: [artist],
    album,
    durationMs: track.duration * 1000,
    artworkUrl: track.image,
    externalUrl: track.prourl ?? track.shareurl,
    isPlayable: Boolean(track.audio),
    previewUrl: track.audio,
    playbackKind: "direct-stream",
    meta: {
      audio: track.audio,
      tags: track.tags,
      musicinfo: track.musicinfo,
    },
  };
}

async function searchDeezer(query: string, options: SearchOptions): Promise<Track[]> {
  const url = new URL("search", `${DEEZER_API}/`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(options.limit ?? 12));
  if (options.offset) {
    url.searchParams.set("index", String(options.offset));
  }

  const response = await fetchJson<{ data?: DeezerTrack[] }>(url.toString());
  return (response.data ?? []).filter((item) => item.type === "track").map(toDeezerTrack);
}

async function searchAudius(query: string, options: SearchOptions): Promise<Track[]> {
  const url = new URL("/v1/tracks/search", AUDIUS_API);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(options.limit ?? 12));
  url.searchParams.set("user_id", "harmonix");
  if (options.offset) {
    url.searchParams.set("offset", String(options.offset));
  }

  const response = await fetchJson<{ data?: AudiusTrack[] }>(url.toString());
  return (response.data ?? []).map(toAudiusTrack);
}

async function searchJamendo(query: string, options: SearchOptions): Promise<Track[]> {
  if (!JAMENDO_CLIENT_ID) {
    throw new Error("Jamendo client id is not configured.");
  }

  const url = new URL("/v3.0/tracks/", JAMENDO_API);
  url.searchParams.set("client_id", JAMENDO_CLIENT_ID);
  url.searchParams.set("format", "jsonpretty");
  url.searchParams.set("search", query);
  url.searchParams.set("limit", String(options.limit ?? 12));
  url.searchParams.set("include", "musicinfo");
  if (options.offset) {
    url.searchParams.set("offset", String(options.offset));
  }

  const response = await fetchJson<{
    headers?: { status?: string; error_message?: string };
    results?: JamendoTrack[];
  }>(url.toString());

  if (response.headers?.status === "failed") {
    throw new Error(response.headers.error_message || "Jamendo search failed.");
  }

  return (response.results ?? []).map(toJamendoTrack);
}

async function searchSource(sourceId: SearchableSourceId, query: string, options: SearchOptions) {
  if (sourceId === "deezer") return searchDeezer(query, options);
  if (sourceId === "audius") return searchAudius(query, options);
  return searchJamendo(query, options);
}

export async function searchMusic(
  query: string,
  options: SearchOptions & { sourceIds?: string[] } = {},
): Promise<MusicSearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return emptyResult();
  }

  const sourceIds = normalizeSearchSourceIds(options.sourceIds);
  const perSourceLimit = Math.max(3, Math.ceil((options.limit ?? 18) / sourceIds.length));

  const settled = await Promise.all(
    sourceIds.map(async (sourceId) => {
      try {
        const tracks = await searchSource(sourceId, trimmed, { ...options, limit: perSourceLimit });
        return {
          sourceId,
          tracks,
          status: { sourceId, ok: true, count: tracks.length } satisfies SourceSearchStatus,
        };
      } catch (error) {
        return {
          sourceId,
          tracks: [] as Track[],
          status: {
            sourceId,
            ok: false,
            count: 0,
            message: error instanceof Error ? error.message : "Search failed.",
          } satisfies SourceSearchStatus,
        };
      }
    }),
  );

  const bySource = new Map(settled.map((result) => [result.sourceId, result.tracks]));
  const tracks: Track[] = [];
  for (let index = 0; tracks.length < (options.limit ?? 18); index += 1) {
    let added = false;
    for (const sourceId of sourceIds) {
      const sourceTracks = bySource.get(sourceId) ?? [];
      const track = sourceTracks[index];
      if (track) {
        tracks.push(track);
        added = true;
      }
      if (tracks.length >= (options.limit ?? 18)) break;
    }
    if (!added) break;
  }

  return {
    tracks,
    albums: [],
    artists: [],
    playlists: [],
    statuses: settled.map((result) => result.status),
  };
}

export function getStreamInfo(track: Track): StreamInfo | null {
  const previewUrl = track.previewUrl ?? (track.meta as { preview?: string } | undefined)?.preview;
  const streamUrl = (track.meta as { streamUrl?: string; audio?: string } | undefined)?.streamUrl;
  const audio = (track.meta as { audio?: string } | undefined)?.audio;
  const url = previewUrl ?? streamUrl ?? audio;

  if (!url) {
    return null;
  }

  return {
    url,
    protocol: "http",
    playbackKind: track.playbackKind ?? (previewUrl ? "preview" : "direct-stream"),
  };
}

export function summarizeTrack(track: Track) {
  return {
    artist: artistName(track),
    duration: formatDuration(track.durationMs),
    playableLabel: track.playbackKind === "preview" ? "Preview" : track.isPlayable ? "Playable" : "External",
  };
}

export function formatDuration(durationMs: number) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "--:--";
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
