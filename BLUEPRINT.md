# Harmonix Mobile - Blueprint

Tanggal: 2026-06-07

Status: arah project sudah dipersempit ke mobile app + InsForge backend setup.

## 1. Fokus Project

Harmonix Mobile adalah aplikasi musik mobile-first. Semua pekerjaan baru diarahkan ke:

- Expo + React Native mobile app.
- Shared music/source types yang dipakai mobile.
- InsForge sebagai backend untuk auth, database, storage, functions, realtime, AI gateway jika dibutuhkan, dan deployment tooling.
- Dokumentasi backend database InsForge.

Non-goals saat ini:

- Semua pekerjaan backend diarahkan ke InsForge.
- Tidak menyimpan secret backend di Expo env public.
- Tidak menghidupkan ulang fitur desktop/Electron di repo ini.

## 2. Keputusan Teknis

| Area | Pilihan | Catatan |
|---|---|---|
| Mobile app | Expo + React Native + TypeScript | Cocok untuk Android/iOS dan dekat dengan React. |
| Routing | Expo Router | File-based routing dan deep link mobile. |
| Backend platform | InsForge | Auth, database, storage, functions, realtime, MCP/CLI. |
| App data access | `@insforge/sdk` | Dipakai dari mobile untuk auth dan data yang sudah punya RLS. |
| Backend infrastructure | InsForge MCP/CLI | Schema, buckets, functions, logs, deployment. |
| Shared contracts | `packages/shared` | Music/source types dan Zod schemas. |
| Audio engine | React Native Track Player | Untuk queue, background playback, dan lock screen controls. |

## 3. Arsitektur Target

```text
Expo mobile app
  -> @insforge/sdk
    -> InsForge Auth
    -> InsForge Database
    -> InsForge Storage
    -> InsForge Functions

Codex / developer
  -> InsForge MCP + npx @insforge/cli
    -> schema, storage bucket, functions, logs, deployment
```

Aturan keamanan:

- Mobile hanya boleh menyimpan public config: `EXPO_PUBLIC_INSFORGE_URL`, `EXPO_PUBLIC_INSFORGE_ANON_KEY`, dan app scheme.
- Admin API key, user API key, database URL, OAuth secrets, OpenRouter key, dan Stripe key tidak boleh masuk Expo app.
- Jika tabel database dibaca langsung dari mobile, RLS harus aktif dan sudah diuji sebagai user biasa.
- Untuk operasi yang butuh secret server-side, gunakan InsForge Functions.

## 4. Struktur Repo Target

```text
music-app/
  apps/
    mobile/
      app/
      src/
        lib/
        theme/
        types/
  packages/
    shared/
      src/
        music.types.ts
        source.types.ts
        zod.ts
  docs/
    insforge-backend-database.md
  AGENTS.md
```

## 5. Backend Database InsForge

Backend aktif saat ini:

```text
https://5izff6gg.ap-southeast.insforge.app
```

Status 2026-06-07: schema musik Harmonix sudah diterapkan ke backend aktif lewat migration InsForge. Tidak ada reset/drop/truncate; migration hanya menambah tabel Harmonix, RLS, policy, index, trigger `updated_at`, dan permission katalog read-only.

Target tabel musik sebaiknya memakai snake_case agar nyaman untuk InsForge/PostgREST:

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

Dokumen detail: `docs/insforge-backend-database.md`.

## 6. Roadmap Mobile

Phase 0: workspace cleanup dan InsForge setup.

- Repo hanya berisi mobile app, shared package, dan docs InsForge.
- Mobile shell menampilkan backend InsForge aktif.
- Env public mobile disiapkan.

Phase 1: auth shell.

- Install dan validasi `@insforge/sdk`.
- Buat auth client wrapper.
- Buat sign in, sign up, verify email, dan logout screens.
- Simpan session sesuai kemampuan SDK dan kebutuhan React Native.

Phase 2: database schema musik.

- Buat migration InsForge untuk tabel Harmonix.
- Aktifkan RLS untuk tabel user-scoped.
- Verifikasi schema dan policy lewat MCP/CLI.

Phase 3: library dan playlist.

- Buat screen Home, Search, Library, Playlists, Settings.
- Buat CRUD playlist dari mobile.
- Sinkronkan source config per user.

Phase 4: player.

- Tambahkan React Native Track Player.
- Buat mini player, full player, queue.
- Tes local file dan remote stream legal.

## 7. Env Mobile

```bash
EXPO_PUBLIC_INSFORGE_URL=https://5izff6gg.ap-southeast.insforge.app
EXPO_PUBLIC_INSFORGE_ANON_KEY=replace-with-insforge-anon-key
EXPO_PUBLIC_APP_SCHEME=harmonix
```

## 8. Prinsip Eksekusi

- Fetch InsForge docs sebelum mengubah integrasi backend.
- Gunakan MCP/CLI untuk backend tasks.
- Utamakan InsForge MCP/CLI dan SDK untuk semua kebutuhan backend.
- Jaga mobile app tetap bisa typecheck setelah cleanup.
- Prioritaskan fitur mobile yang terlihat dan bisa diuji di device.
