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

Metadata InsForge MCP menunjukkan backend aktif belum berisi schema musik Harmonix. Tabel yang terlihat saat ini masih berasal dari app lain, misalnya:

- `users`, `user_profiles`, `devices`
- `translation_requests`, `translation_results`
- `plans`, `subscriptions`, `payments`, `usage_quotas`
- `ai_models`, `ai_providers`, `ai_usage_logs`
- `languages`, `tones`, `prompt_templates`

Sampel schema menunjukkan RLS belum aktif untuk tabel yang dicek. Karena backend aktif sudah memiliki data dan tabel non-Harmonix, jangan menjalankan reset, drop, atau destructive migration tanpa konfirmasi eksplisit.

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

| Tabel | Fungsi |
|---|---|
| `profiles` | Profil app tambahan untuk user InsForge. |
| `source_configs` | Preferensi source musik per user. |
| `source_accounts` | Koneksi akun eksternal per source. |
| `canonical_tracks` | Normalisasi track lintas source. |
| `source_tracks` | Metadata track per provider/source. |
| `playlists` | Playlist milik user. |
| `playlist_items` | Isi playlist dan urutan track. |
| `devices` | Device user dan push token. |
| `local_assets` | Metadata file lokal per user/device. |
| `play_history` | Riwayat pemutaran. |

Enum source musik:

```text
local | spotify | ytmusic | deezer | jamendo | audius | soundcloud
```

Relasi inti:

- Semua data user-scoped harus punya `user_id`.
- `profiles.user_id` unik.
- `source_configs` unik per `user_id + source`.
- `source_accounts` unik per `user_id + source`.
- `source_tracks` unik per `source + source_id`.
- `playlist_items` punya `playlist_id`, `track_id`, dan `position`.
- `local_assets` unik per `user_id + local_key_hash`.
- `play_history` mengarah ke `user_id` dan `track_id`.

## RLS Minimum

Jika mobile membaca/menulis database langsung lewat SDK, RLS wajib aktif.

Policy minimum untuk tabel user-scoped:

- User hanya bisa `select` row dengan `user_id = auth.uid()`.
- User hanya bisa `insert` row dengan `user_id = auth.uid()`.
- User hanya bisa `update/delete` row miliknya sendiri.
- Tabel catalog global seperti `canonical_tracks` dan `source_tracks` bisa readonly untuk authenticated user, atau ditulis hanya lewat function/server-side flow.

Sebelum mengandalkan mobile SDK, uji policy sebagai authenticated user. Jangan hanya menguji dengan admin key.

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

- [ ] Backend aktif/project baru untuk Harmonix sudah diputuskan.
- [ ] Anon key tersedia di env lokal mobile.
- [ ] Auth InsForge berhasil dari mobile.
- [ ] Schema musik sudah ada.
- [ ] RLS sudah aktif.
- [ ] Policy sudah diuji sebagai user biasa.
- [ ] Tidak ada secret backend di mobile env.
