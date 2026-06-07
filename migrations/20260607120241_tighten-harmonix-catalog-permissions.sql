revoke insert, update, delete on public.canonical_tracks from authenticated;
revoke insert, update, delete on public.source_tracks from authenticated;

grant select on public.canonical_tracks to authenticated;
grant select on public.source_tracks to authenticated;
