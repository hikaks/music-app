import { MUSIC_SOURCE_IDS, playlistCreateSchema, type Track } from "@harmonix-mobile/shared";
import { insforge } from "@/lib/insforge";
import { toAppErrorMessage } from "@/lib/errors";

export type ProfileRecord = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type PlaylistRecord = {
  id: string;
  name: string;
  description: string | null;
  source: string;
  visibility: string;
  updated_at: string;
};

export type SourceConfigRecord = {
  id: string;
  source: string;
  enabled: boolean;
  sync_enabled: boolean;
  updated_at: string;
};

export type PlaylistTrackAddResult = {
  playlistItemId: string;
  playlistId: string;
  trackId: string;
  sourceTrackId: string | null;
  position: number;
  alreadyExists: boolean;
};

type CurrentUser = {
  id: string;
  email: string;
  profile?: {
    name?: string;
    avatar_url?: string;
  };
};

const profileColumns = "user_id, display_name, avatar_url, bio, created_at, updated_at";
const playlistColumns = "id, name, description, source, visibility, updated_at";
const sourceConfigColumns = "id, source, enabled, sync_enabled, updated_at";
const defaultEnabledSources = new Set(["local", "deezer", "audius"]);
const defaultSavedPlaylistName = "Liked Songs";

function throwIfError(error: unknown, fallback: string): asserts error is null | undefined {
  if (error) {
    throw new Error(toAppErrorMessage(error, fallback));
  }
}

export async function getOrCreateProfile(user: CurrentUser) {
  const existing = await insforge.database
    .from("profiles")
    .select(profileColumns)
    .eq("user_id", user.id)
    .maybeSingle<ProfileRecord>();

  throwIfError(existing.error, "Unable to load profile.");

  if (existing.data) {
    return existing.data;
  }

  const displayName = user.profile?.name ?? user.email.split("@")[0] ?? "Harmonix listener";
  const created = await insforge.database
    .from("profiles")
    .insert({
      display_name: displayName,
      avatar_url: user.profile?.avatar_url ?? null,
    })
    .select(profileColumns)
    .single<ProfileRecord>();

  throwIfError(created.error, "Unable to create profile.");

  return created.data;
}

export async function updateProfile(
  userId: string,
  input: {
    displayName: string;
    bio?: string;
  },
) {
  const displayName = input.displayName.trim();
  const bio = input.bio?.trim() ?? "";

  if (displayName.length > 120) {
    throw new Error("Display name must be 120 characters or fewer.");
  }

  if (bio.length > 500) {
    throw new Error("Bio must be 500 characters or fewer.");
  }

  const { data, error } = await insforge.database
    .from("profiles")
    .update({
      display_name: displayName || null,
      bio: bio || null,
    })
    .eq("user_id", userId)
    .select(profileColumns)
    .single<ProfileRecord>();

  throwIfError(error, "Unable to update profile.");

  return data;
}

export async function listPlaylists() {
  const { data, error } = await insforge.database
    .from("playlists")
    .select(playlistColumns)
    .order("updated_at", { ascending: false });

  throwIfError(error, "Unable to load playlists.");

  return (data ?? []) as PlaylistRecord[];
}

export async function createPlaylist(input: { name: string; description?: string }) {
  const parsed = playlistCreateSchema.parse(input);
  const { data, error } = await insforge.database
    .from("playlists")
    .insert({
      name: parsed.name,
      description: parsed.description ?? null,
    })
    .select(playlistColumns)
    .single<PlaylistRecord>();

  throwIfError(error, "Unable to create playlist.");

  return data;
}

export async function updatePlaylist(id: string, input: { name: string; description?: string }) {
  const parsed = playlistCreateSchema.parse(input);
  const { data, error } = await insforge.database
    .from("playlists")
    .update({
      name: parsed.name,
      description: parsed.description ?? null,
    })
    .eq("id", id)
    .select(playlistColumns)
    .single<PlaylistRecord>();

  throwIfError(error, "Unable to update playlist.");

  return data;
}

export async function deletePlaylist(id: string) {
  const { error } = await insforge.database.from("playlists").delete().eq("id", id);
  throwIfError(error, "Unable to delete playlist.");
}

function serializeTrackForPlaylist(track: Track) {
  return JSON.parse(
    JSON.stringify({
      source: track.source,
      sourceId: track.sourceId,
      title: track.title,
      artists: track.artists,
      artistName: track.artists.map((artist) => artist.name).filter(Boolean).join(", "),
      album: track.album
        ? {
            id: track.album.id,
            title: track.album.title,
            artists: track.album.artists,
            source: track.album.source,
            artworkUrl: track.album.artworkUrl,
            externalUrl: track.album.externalUrl,
          }
        : undefined,
      durationMs: Math.max(0, Math.round(track.durationMs || 0)),
      isrc: track.isrc,
      artworkUrl: track.artworkUrl,
      previewUrl: track.previewUrl,
      externalUrl: track.externalUrl,
      isPlayable: track.isPlayable,
      playbackKind: track.playbackKind ?? "unknown",
      meta: track.meta ?? {},
    }),
  ) as Record<string, unknown>;
}

async function getOrCreateDefaultSavedPlaylist() {
  const playlists = await listPlaylists();
  const existing = playlists.find((playlist) => playlist.name.toLowerCase() === defaultSavedPlaylistName.toLowerCase());

  if (existing) {
    return existing;
  }

  return createPlaylist({
    name: defaultSavedPlaylistName,
    description: "Saved from Harmonix search.",
  });
}

export async function addTrackToPlaylist(playlistId: string, track: Track) {
  const { data, error } = await insforge.database.rpc("add_track_to_playlist", {
    p_playlist_id: playlistId,
    p_track: serializeTrackForPlaylist(track),
  });

  throwIfError(error, "Unable to save track to playlist.");

  if (!data) {
    throw new Error("Unable to save track to playlist.");
  }

  return data as PlaylistTrackAddResult;
}

export async function saveTrackToDefaultPlaylist(track: Track) {
  const playlist = await getOrCreateDefaultSavedPlaylist();
  const item = await addTrackToPlaylist(playlist.id, track);
  return { playlist, item };
}

export async function ensureSourceConfigs() {
  const current = await insforge.database
    .from("source_configs")
    .select(sourceConfigColumns)
    .order("source", { ascending: true });

  throwIfError(current.error, "Unable to load source settings.");

  const currentRows = (current.data ?? []) as SourceConfigRecord[];
  const existingSources = new Set(currentRows.map((row) => row.source));
  const missing = MUSIC_SOURCE_IDS.filter((source) => !existingSources.has(source));

  if (missing.length === 0) {
    return currentRows;
  }

  const created = await insforge.database
    .from("source_configs")
    .insert(
      missing.map((source) => ({
        source,
        enabled: defaultEnabledSources.has(source),
      })),
    )
    .select(sourceConfigColumns);

  throwIfError(created.error, "Unable to initialize source settings.");

  const createdRows = (created.data ?? []) as SourceConfigRecord[];
  return [...currentRows, ...createdRows].sort((a, b) => a.source.localeCompare(b.source));
}

export async function updateSourceConfig(id: string, enabled: boolean) {
  const { data, error } = await insforge.database
    .from("source_configs")
    .update({ enabled })
    .eq("id", id)
    .select(sourceConfigColumns)
    .single<SourceConfigRecord>();

  throwIfError(error, "Unable to update source settings.");

  return data;
}

export async function runRlsSmokeTest(user: CurrentUser) {
  await getOrCreateProfile(user);

  const created = await insforge.database
    .from("playlists")
    .insert({
      name: "Harmonix RLS Check",
      description: "temporary",
    })
    .select("id, name")
    .single<{ id: string; name: string }>();

  throwIfError(created.error, "Unable to create the RLS check row.");

  const selected = await insforge.database
    .from("playlists")
    .select("id, name")
    .eq("id", created.data.id)
    .single<{ id: string; name: string }>();

  throwIfError(selected.error, "Unable to read the RLS check row.");

  const deleted = await insforge.database.from("playlists").delete().eq("id", created.data.id);
  throwIfError(deleted.error, "Unable to delete the RLS check row.");

  return selected.data;
}
