# InsForge Backend Database

Diperbarui: 2026-06-07

Dokumen ini menjadi pegangan backend database untuk Harmonix Mobile. Repo sekarang difokuskan ke mobile app + InsForge setup.

## Project InsForge Aktif

| Field | Nilai |
|---|---|
| Project | My First Project |
| Project ID | `b8bcb919-7b63-4a1f-9753-1837df036923` |
| App key | `5izff6gg` |
| Region | `ap-southeast` |
| Backend URL | `https://5izff6gg.ap-southeast.insforge.app` |
| Backend version | `1.0.0` |

## Status Backend Saat Ini

Metadata InsForge MCP dan CLI pada 2026-06-07 menunjukkan backend aktif sudah berisi schema database Harmonix di schema `public`.

Migration yang sudah diterapkan:

- `20260607115730_create-harmonix-music-schema.sql`
- `20260607120241_tighten-harmonix-catalog-permissions.sql`
- `20260608002000_add-track-to-playlist-rpc.sql`

Tabel `public` aktif:

- `profiles`
- `source_configs`
- `source_accounts`
- `canonical_tracks`
- `source_tracks`
- `playlists`
- `playlist_items`
- `devices`
- `local_assets`
- `play_history`

Semua tabel masih kosong setelah migration. Storage bucket dan InsForge Functions juga masih kosong. Auth aktif dengan email verification metode `code`, reset password metode `code`, OAuth provider `google` dan `github`, signup aktif, dan SMTP belum dikonfigurasi.

Tidak ada reset, drop table, truncate, atau perubahan destruktif ke data existing. Migration hanya menambah schema Harmonix dan memperketat grant katalog global.

## Pola Akses Mobile

Target akses data:

```text
Expo mobile app
  -> @insforge/sdk
    -> InsForge Auth
    -> InsForge Database
    -> InsForge Storage
    -> InsForge Functions
```

MCP/CLI dipakai untuk infrastruktur:

```text
Codex / developer
  -> InsForge MCP + npx @insforge/cli
    -> metadata, migrations, RLS, buckets, functions, logs
```

Mobile hanya boleh memakai public env:

```bash
EXPO_PUBLIC_INSFORGE_URL=https://5izff6gg.ap-southeast.insforge.app
EXPO_PUBLIC_INSFORGE_ANON_KEY=replace-with-insforge-anon-key
EXPO_PUBLIC_APP_SCHEME=harmonix
```

Jangan memasukkan admin key, user API key, database connection string, OAuth secret, OpenRouter key, atau Stripe secret ke Expo app.

## Target Schema Harmonix

Gunakan nama tabel snake_case agar nyaman dipakai lewat InsForge/PostgREST dan SDK:

| Tabel | Fungsi | Akses mobile |
|---|---|---|
| `profiles` | Profil app tambahan untuk user InsForge. | CRUD row milik user. |
| `source_configs` | Preferensi source musik per user. | CRUD row milik user. |
| `source_accounts` | Metadata koneksi akun eksternal per source. Tidak menyimpan token provider. | CRUD row milik user. |
| `canonical_tracks` | Normalisasi track lintas source. | Read-only untuk authenticated user. |
| `source_tracks` | Metadata track per provider/source. | Read-only untuk authenticated user. |
| `playlists` | Playlist milik user. | CRUD row milik user. |
| `playlist_items` | Isi playlist dan urutan track. | CRUD row milik user. |
| `devices` | Device user dan push token. | CRUD row milik user. |
| `local_assets` | Metadata file lokal per user/device. | CRUD row milik user. |
| `play_history` | Riwayat pemutaran. | CRUD row milik user. |

Enum source musik:

```text
local | spotify | ytmusic | deezer | jamendo | audius | soundcloud
```

Relasi inti:

- Semua data user-scoped punya `user_id uuid not null default auth.uid()`.
- `profiles.user_id` adalah primary key.
- `source_configs` unik per `user_id + source`.
- `source_accounts` unik per `user_id + source`.
- `source_tracks` unik per `source + source_id`.
- `playlist_items` punya `playlist_id`, `track_id`, `position`, dan composite FK `(playlist_id, user_id)` ke `playlists(id, user_id)`.
- `local_assets` unik per `user_id + local_key_hash`.
- `play_history` mengarah ke `user_id` dan `track_id`.

## RLS Minimum

Jika mobile membaca/menulis database langsung lewat SDK, RLS wajib aktif.

Status RLS saat ini:

- Semua 10 tabel `public` sudah `enable row level security`.
- Ada 34 policy: 4 own-row policy untuk setiap tabel user-scoped, dan SELECT-only policy untuk `canonical_tracks` serta `source_tracks`.
- Role `authenticated` punya CRUD grant pada tabel user-scoped.
- Role `authenticated` hanya punya SELECT grant pada `canonical_tracks` dan `source_tracks`.
- `canonical_tracks` dan `source_tracks` sengaja tidak punya policy INSERT/UPDATE/DELETE untuk user biasa.
- Mobile menambahkan hasil search ke playlist lewat RPC `public.add_track_to_playlist(uuid, jsonb)`, sehingga ownership playlist tetap dicek dengan `auth.uid()` dan katalog global tetap read-only dari client.

Verifikasi struktural sudah dilakukan lewat MCP/CLI: tabel, index, FK, trigger, grant, dan policy terbaca sesuai rancangan. Tes runtime sebagai user biasa masih perlu dilakukan setelah auth mobile berjalan, karena raw SQL InsForge menolak simulasi session/JWT claim dengan pesan `Changing SQL session configuration is not allowed.`

## Workflow Aman

Selalu fetch docs sebelum mengubah integrasi InsForge:

```text
MCP fetch_docs("instructions")
MCP fetch_sdk_docs("auth", "typescript")
MCP fetch_sdk_docs("db", "typescript")
```

Inspeksi backend:

```bash
npx @insforge/cli current
npx @insforge/cli metadata --json
npx @insforge/cli db tables
npx @insforge/cli db migrations list
```

Urutan kerja:

1. Pastikan backend target memang untuk Harmonix.
2. Buat migration schema musik.
3. Tambahkan RLS dan policy.
4. Apply migration lewat InsForge CLI/MCP.
5. Verifikasi dengan `get_backend_metadata` dan `get_table_schema`.
6. Baru hubungkan mobile screens ke tabel tersebut.

## Checklist Sebelum Implementasi Data Mobile

- [x] Backend aktif/project baru untuk Harmonix sudah diputuskan.
- [ ] Anon key tersedia di env lokal mobile.
- [ ] Auth InsForge berhasil dari mobile.
- [x] Schema musik sudah ada.
- [x] RLS sudah aktif.
- [ ] Policy sudah diuji sebagai user biasa.
- [ ] Tidak ada secret backend di mobile env.
