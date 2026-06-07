create or replace function public.add_track_to_playlist(
  p_playlist_id uuid,
  p_track jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_source public.music_source;
  v_source_text text := nullif(btrim(coalesce(p_track->>'source', '')), '');
  v_source_id text := nullif(btrim(coalesce(p_track->>'sourceId', p_track->>'source_id', '')), '');
  v_title text := nullif(btrim(coalesce(p_track->>'title', '')), '');
  v_artists jsonb := case
    when jsonb_typeof(p_track->'artists') = 'array' then p_track->'artists'
    else '[]'::jsonb
  end;
  v_artist_name text;
  v_album_title text := nullif(btrim(coalesce(p_track #>> '{album,title}', p_track->>'albumTitle', '')), '');
  v_duration_ms integer := greatest(coalesce(nullif(p_track->>'durationMs', '')::integer, 0), 0);
  v_isrc text := nullif(btrim(coalesce(p_track->>'isrc', '')), '');
  v_artwork_url text := nullif(btrim(coalesce(p_track->>'artworkUrl', '')), '');
  v_preview_url text := nullif(btrim(coalesce(p_track->>'previewUrl', '')), '');
  v_external_url text := nullif(btrim(coalesce(p_track->>'externalUrl', '')), '');
  v_is_playable boolean := coalesce(nullif(p_track->>'isPlayable', '')::boolean, false);
  v_playback_text text := nullif(btrim(coalesce(p_track->>'playbackKind', '')), '');
  v_playback_kind public.playback_kind := 'unknown';
  v_metadata jsonb := case
    when jsonb_typeof(p_track->'meta') = 'object' then p_track->'meta'
    else '{}'::jsonb
  end;
  v_canonical_id uuid;
  v_source_track_id uuid;
  v_position integer;
  v_existing_item public.playlist_items%rowtype;
  v_new_item public.playlist_items%rowtype;
begin
  if v_user_id is null then
    raise exception 'Unauthorized' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.playlists
    where id = p_playlist_id
      and user_id = v_user_id
  ) then
    raise exception 'Playlist not found' using errcode = 'P0002';
  end if;

  if v_source_text is null or v_source_id is null or v_title is null then
    raise exception 'Track source, sourceId, and title are required' using errcode = '22023';
  end if;

  v_source := v_source_text::public.music_source;
  v_artist_name := coalesce(
    nullif(btrim(p_track->>'artistName'), ''),
    nullif(btrim(v_artists #>> '{0,name}'), ''),
    'Unknown Artist'
  );

  if v_playback_text in ('direct-stream', 'preview', 'local-file', 'external', 'remote-control', 'unknown') then
    v_playback_kind := v_playback_text::public.playback_kind;
  end if;

  if v_isrc is not null then
    select id
    into v_canonical_id
    from public.canonical_tracks
    where lower(isrc) = lower(v_isrc)
    limit 1;
  end if;

  if v_canonical_id is null then
    select canonical_track_id
    into v_canonical_id
    from public.source_tracks
    where source = v_source
      and source_id = v_source_id
    limit 1;
  end if;

  if v_canonical_id is null then
    insert into public.canonical_tracks (
      title,
      artist_name,
      artists,
      album_title,
      duration_ms,
      isrc,
      artwork_url,
      metadata
    )
    values (
      v_title,
      v_artist_name,
      v_artists,
      v_album_title,
      v_duration_ms,
      v_isrc,
      v_artwork_url,
      jsonb_build_object('source', v_source, 'sourceId', v_source_id)
    )
    returning id into v_canonical_id;
  else
    update public.canonical_tracks
    set
      artist_name = coalesce(nullif(artist_name, ''), v_artist_name),
      artists = case when jsonb_array_length(artists) = 0 then v_artists else artists end,
      album_title = coalesce(album_title, v_album_title),
      duration_ms = greatest(duration_ms, v_duration_ms),
      artwork_url = coalesce(artwork_url, v_artwork_url)
    where id = v_canonical_id;
  end if;

  insert into public.source_tracks (
    canonical_track_id,
    source,
    source_id,
    title,
    artist_name,
    artists,
    album_title,
    duration_ms,
    artwork_url,
    preview_url,
    external_url,
    is_playable,
    playback_kind,
    metadata
  )
  values (
    v_canonical_id,
    v_source,
    v_source_id,
    v_title,
    v_artist_name,
    v_artists,
    v_album_title,
    v_duration_ms,
    v_artwork_url,
    v_preview_url,
    v_external_url,
    v_is_playable,
    v_playback_kind,
    v_metadata
  )
  on conflict (source, source_id) do update
  set
    canonical_track_id = excluded.canonical_track_id,
    title = excluded.title,
    artist_name = excluded.artist_name,
    artists = excluded.artists,
    album_title = excluded.album_title,
    duration_ms = excluded.duration_ms,
    artwork_url = coalesce(excluded.artwork_url, public.source_tracks.artwork_url),
    preview_url = coalesce(excluded.preview_url, public.source_tracks.preview_url),
    external_url = coalesce(excluded.external_url, public.source_tracks.external_url),
    is_playable = excluded.is_playable,
    playback_kind = excluded.playback_kind,
    metadata = public.source_tracks.metadata || excluded.metadata
  returning id into v_source_track_id;

  select *
  into v_existing_item
  from public.playlist_items
  where playlist_id = p_playlist_id
    and user_id = v_user_id
    and source_track_id = v_source_track_id
  limit 1;

  if found then
    return jsonb_build_object(
      'playlistItemId', v_existing_item.id,
      'playlistId', v_existing_item.playlist_id,
      'trackId', v_existing_item.track_id,
      'sourceTrackId', v_existing_item.source_track_id,
      'position', v_existing_item.position,
      'alreadyExists', true
    );
  end if;

  select coalesce(max(position) + 1, 0)
  into v_position
  from public.playlist_items
  where playlist_id = p_playlist_id;

  insert into public.playlist_items (
    playlist_id,
    user_id,
    track_id,
    source_track_id,
    position,
    metadata
  )
  values (
    p_playlist_id,
    v_user_id,
    v_canonical_id,
    v_source_track_id,
    v_position,
    jsonb_build_object('source', v_source, 'sourceId', v_source_id)
  )
  returning * into v_new_item;

  return jsonb_build_object(
    'playlistItemId', v_new_item.id,
    'playlistId', v_new_item.playlist_id,
    'trackId', v_new_item.track_id,
    'sourceTrackId', v_new_item.source_track_id,
    'position', v_new_item.position,
    'alreadyExists', false
  );
end;
$$;

revoke all on function public.add_track_to_playlist(uuid, jsonb) from public;
grant execute on function public.add_track_to_playlist(uuid, jsonb) to authenticated;

comment on function public.add_track_to_playlist(uuid, jsonb) is
  'Adds a searched provider track to a user-owned playlist while keeping global catalog tables read-only to mobile users.';
