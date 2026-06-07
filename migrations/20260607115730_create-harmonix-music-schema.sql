create type public.music_source as enum (
  'local',
  'spotify',
  'ytmusic',
  'deezer',
  'jamendo',
  'audius',
  'soundcloud'
);

create type public.playback_kind as enum (
  'direct-stream',
  'preview',
  'local-file',
  'external',
  'remote-control',
  'unknown'
);

create type public.playlist_visibility as enum (
  'private',
  'unlisted',
  'public'
);

create type public.source_account_status as enum (
  'connected',
  'expired',
  'revoked',
  'error'
);

create type public.device_platform as enum (
  'ios',
  'android',
  'web'
);

create table public.profiles (
  user_id uuid primary key default auth.uid(),
  display_name text,
  avatar_url text,
  bio text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_preferences_object check (jsonb_typeof(preferences) = 'object')
);

create table public.source_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  source public.music_source not null,
  enabled boolean not null default false,
  sync_enabled boolean not null default false,
  last_sync_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_configs_user_source_key unique (user_id, source),
  constraint source_configs_settings_object check (jsonb_typeof(settings) = 'object')
);

create table public.source_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  source public.music_source not null,
  external_user_id text,
  username text,
  scopes text[] not null default '{}'::text[],
  status public.source_account_status not null default 'connected',
  connected_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_accounts_user_source_key unique (user_id, source),
  constraint source_accounts_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.canonical_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_name text not null,
  artists jsonb not null default '[]'::jsonb,
  album_title text,
  duration_ms integer not null default 0,
  isrc text,
  artwork_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canonical_tracks_duration_nonnegative check (duration_ms >= 0),
  constraint canonical_tracks_artists_array check (jsonb_typeof(artists) = 'array'),
  constraint canonical_tracks_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.source_tracks (
  id uuid primary key default gen_random_uuid(),
  canonical_track_id uuid references public.canonical_tracks(id) on delete set null,
  source public.music_source not null,
  source_id text not null,
  title text not null,
  artist_name text not null,
  artists jsonb not null default '[]'::jsonb,
  album_title text,
  duration_ms integer not null default 0,
  artwork_url text,
  preview_url text,
  external_url text,
  is_playable boolean not null default true,
  playback_kind public.playback_kind not null default 'unknown',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_tracks_source_source_id_key unique (source, source_id),
  constraint source_tracks_duration_nonnegative check (duration_ms >= 0),
  constraint source_tracks_artists_array check (jsonb_typeof(artists) = 'array'),
  constraint source_tracks_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  source public.music_source not null default 'local',
  source_playlist_id text,
  name text not null,
  description text,
  visibility public.playlist_visibility not null default 'private',
  artwork_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint playlists_id_user_id_key unique (id, user_id),
  constraint playlists_name_not_blank check (length(btrim(name)) > 0),
  constraint playlists_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null,
  user_id uuid not null default auth.uid(),
  track_id uuid not null references public.canonical_tracks(id) on delete restrict,
  source_track_id uuid references public.source_tracks(id) on delete set null,
  position integer not null,
  added_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint playlist_items_playlist_owner_fk
    foreign key (playlist_id, user_id)
    references public.playlists(id, user_id)
    on delete cascade,
  constraint playlist_items_playlist_position_key unique (playlist_id, position),
  constraint playlist_items_position_nonnegative check (position >= 0),
  constraint playlist_items_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  installation_id text not null,
  platform public.device_platform not null,
  device_name text,
  push_token text,
  app_version text,
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint devices_id_user_id_key unique (id, user_id),
  constraint devices_user_installation_key unique (user_id, installation_id),
  constraint devices_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.local_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  device_id uuid,
  track_id uuid references public.canonical_tracks(id) on delete set null,
  local_key_hash text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  duration_ms integer,
  storage_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint local_assets_device_owner_fk
    foreign key (device_id, user_id)
    references public.devices(id, user_id)
    on delete cascade,
  constraint local_assets_user_key_hash_key unique (user_id, local_key_hash),
  constraint local_assets_size_nonnegative check (size_bytes is null or size_bytes >= 0),
  constraint local_assets_duration_nonnegative check (duration_ms is null or duration_ms >= 0),
  constraint local_assets_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.play_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  track_id uuid not null references public.canonical_tracks(id) on delete restrict,
  source_track_id uuid references public.source_tracks(id) on delete set null,
  device_id uuid,
  played_at timestamptz not null default now(),
  duration_played_ms integer,
  completed boolean not null default false,
  context_type text,
  context_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  constraint play_history_duration_nonnegative check (duration_played_ms is null or duration_played_ms >= 0),
  constraint play_history_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index profiles_updated_at_idx on public.profiles (updated_at desc);
create index source_configs_user_id_idx on public.source_configs (user_id);
create index source_accounts_user_id_idx on public.source_accounts (user_id);
create index canonical_tracks_title_idx on public.canonical_tracks (title);
create unique index canonical_tracks_isrc_key on public.canonical_tracks (lower(isrc)) where isrc is not null and btrim(isrc) <> '';
create index source_tracks_canonical_track_id_idx on public.source_tracks (canonical_track_id);
create index source_tracks_source_idx on public.source_tracks (source);
create index source_tracks_title_idx on public.source_tracks (title);
create index playlists_user_id_updated_at_idx on public.playlists (user_id, updated_at desc);
create index playlist_items_playlist_id_position_idx on public.playlist_items (playlist_id, position);
create index playlist_items_user_id_idx on public.playlist_items (user_id);
create index playlist_items_track_id_idx on public.playlist_items (track_id);
create index devices_user_id_last_seen_at_idx on public.devices (user_id, last_seen_at desc);
create index local_assets_user_id_idx on public.local_assets (user_id);
create index local_assets_track_id_idx on public.local_assets (track_id);
create index play_history_user_id_played_at_idx on public.play_history (user_id, played_at desc);
create index play_history_track_id_idx on public.play_history (track_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger source_configs_set_updated_at
  before update on public.source_configs
  for each row execute function public.set_updated_at();

create trigger source_accounts_set_updated_at
  before update on public.source_accounts
  for each row execute function public.set_updated_at();

create trigger canonical_tracks_set_updated_at
  before update on public.canonical_tracks
  for each row execute function public.set_updated_at();

create trigger source_tracks_set_updated_at
  before update on public.source_tracks
  for each row execute function public.set_updated_at();

create trigger playlists_set_updated_at
  before update on public.playlists
  for each row execute function public.set_updated_at();

create trigger devices_set_updated_at
  before update on public.devices
  for each row execute function public.set_updated_at();

create trigger local_assets_set_updated_at
  before update on public.local_assets
  for each row execute function public.set_updated_at();

grant usage on schema public to authenticated;
grant usage on type public.music_source to authenticated;
grant usage on type public.playback_kind to authenticated;
grant usage on type public.playlist_visibility to authenticated;
grant usage on type public.source_account_status to authenticated;
grant usage on type public.device_platform to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.source_configs to authenticated;
grant select, insert, update, delete on public.source_accounts to authenticated;
grant select on public.canonical_tracks to authenticated;
grant select on public.source_tracks to authenticated;
grant select, insert, update, delete on public.playlists to authenticated;
grant select, insert, update, delete on public.playlist_items to authenticated;
grant select, insert, update, delete on public.devices to authenticated;
grant select, insert, update, delete on public.local_assets to authenticated;
grant select, insert, update, delete on public.play_history to authenticated;

alter table public.profiles enable row level security;
alter table public.source_configs enable row level security;
alter table public.source_accounts enable row level security;
alter table public.canonical_tracks enable row level security;
alter table public.source_tracks enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;
alter table public.devices enable row level security;
alter table public.local_assets enable row level security;
alter table public.play_history enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (user_id = auth.uid());
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (user_id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using (user_id = auth.uid());

create policy source_configs_select_own on public.source_configs
  for select to authenticated
  using (user_id = auth.uid());
create policy source_configs_insert_own on public.source_configs
  for insert to authenticated
  with check (user_id = auth.uid());
create policy source_configs_update_own on public.source_configs
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy source_configs_delete_own on public.source_configs
  for delete to authenticated
  using (user_id = auth.uid());

create policy source_accounts_select_own on public.source_accounts
  for select to authenticated
  using (user_id = auth.uid());
create policy source_accounts_insert_own on public.source_accounts
  for insert to authenticated
  with check (user_id = auth.uid());
create policy source_accounts_update_own on public.source_accounts
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy source_accounts_delete_own on public.source_accounts
  for delete to authenticated
  using (user_id = auth.uid());

create policy canonical_tracks_select_authenticated on public.canonical_tracks
  for select to authenticated
  using (true);

create policy source_tracks_select_authenticated on public.source_tracks
  for select to authenticated
  using (true);

create policy playlists_select_own on public.playlists
  for select to authenticated
  using (user_id = auth.uid());
create policy playlists_insert_own on public.playlists
  for insert to authenticated
  with check (user_id = auth.uid());
create policy playlists_update_own on public.playlists
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy playlists_delete_own on public.playlists
  for delete to authenticated
  using (user_id = auth.uid());

create policy playlist_items_select_own on public.playlist_items
  for select to authenticated
  using (user_id = auth.uid());
create policy playlist_items_insert_own on public.playlist_items
  for insert to authenticated
  with check (user_id = auth.uid());
create policy playlist_items_update_own on public.playlist_items
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy playlist_items_delete_own on public.playlist_items
  for delete to authenticated
  using (user_id = auth.uid());

create policy devices_select_own on public.devices
  for select to authenticated
  using (user_id = auth.uid());
create policy devices_insert_own on public.devices
  for insert to authenticated
  with check (user_id = auth.uid());
create policy devices_update_own on public.devices
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy devices_delete_own on public.devices
  for delete to authenticated
  using (user_id = auth.uid());

create policy local_assets_select_own on public.local_assets
  for select to authenticated
  using (user_id = auth.uid());
create policy local_assets_insert_own on public.local_assets
  for insert to authenticated
  with check (user_id = auth.uid());
create policy local_assets_update_own on public.local_assets
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy local_assets_delete_own on public.local_assets
  for delete to authenticated
  using (user_id = auth.uid());

create policy play_history_select_own on public.play_history
  for select to authenticated
  using (user_id = auth.uid());
create policy play_history_insert_own on public.play_history
  for insert to authenticated
  with check (user_id = auth.uid());
create policy play_history_update_own on public.play_history
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy play_history_delete_own on public.play_history
  for delete to authenticated
  using (user_id = auth.uid());

comment on table public.profiles is 'Harmonix app profile data owned by a single InsForge auth user.';
comment on table public.source_configs is 'Per-user source enablement and sync preferences.';
comment on table public.source_accounts is 'Per-user external source account metadata. Does not store provider tokens or secrets.';
comment on table public.canonical_tracks is 'Global normalized track catalog shared across sources.';
comment on table public.source_tracks is 'Provider/source-specific track metadata mapped to canonical tracks.';
comment on table public.playlists is 'User-owned Harmonix playlists.';
comment on table public.playlist_items is 'Ordered track membership for user-owned playlists.';
comment on table public.devices is 'User-owned mobile/web installations and push token metadata.';
comment on table public.local_assets is 'User/device-scoped metadata for local audio files.';
comment on table public.play_history is 'User-owned playback history events.';
