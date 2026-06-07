# Harmonix Mobile - Tasks

Tanggal: 2026-06-07

Checklist ini hanya memuat pekerjaan yang berkaitan dengan mobile app dan InsForge setup.

## Status Legend

- `[ ]` Belum dikerjakan
- `[~]` Sedang dikerjakan
- `[x]` Selesai
- `[!]` Butuh keputusan / berisiko

## Phase 0 - Repo Cleanup dan InsForge Setup

- [x] Link workspace ke InsForge project `b8bcb919-7b63-4a1f-9753-1837df036923`.
- [x] Install/configure InsForge MCP untuk Codex.
- [x] Tambahkan `AGENTS.md` dari InsForge setup.
- [x] Tambahkan dokumentasi backend database InsForge.
- [x] Hapus scaffold non-InsForge yang tidak dipakai.
- [x] Ubah mobile placeholder agar menampilkan backend InsForge.
- [x] Hapus alias TypeScript dan script placeholder yang mengarah ke struktur lama.
- [x] Ambil dan simpan anon key di env lokal mobile.
- [x] Jalankan typecheck setelah lockfile dirapikan.

## Phase 1 - Mobile Foundation

- [x] Pertahankan Expo app di `apps/mobile`.
- [x] Pertahankan shared music/source types di `packages/shared`.
- [x] Siapkan `src/lib/insforge.ts`.
- [~] Validasi `@insforge/sdk` di React Native runtime.
- [x] Buat app shell dengan route group auth dan tabs.
- [x] Buat theme tokens untuk mobile UI.
- [ ] Tambahkan TanStack Query bila mulai ada server state kompleks.
- [x] Tambahkan Expo SecureStore bila session/token perlu persist manual.

## Phase 2 - InsForge Auth

- [x] Pastikan auth config InsForge cocok untuk mobile.
- [ ] Tambahkan redirect URL/scheme mobile jika OAuth dipakai.
- [x] Buat screen sign in.
- [x] Buat screen sign up.
- [x] Buat screen verify email code.
- [x] Buat logout action.
- [x] Buat guard untuk signed-in dan signed-out state.

## Phase 3 - InsForge Database Musik

- [x] Pakai project InsForge aktif untuk schema Harmonix.
- [x] Buat migration untuk tabel musik snake_case.
- [x] Buat migration permission untuk katalog track read-only.
- [x] Buat RLS untuk semua tabel user-scoped.
- [x] Verifikasi schema, grant, index, trigger, dan policy lewat MCP/CLI.
- [ ] Verifikasi policy sebagai authenticated user nyata dari mobile/auth token.
- [x] Dokumentasikan setiap tabel di `docs/insforge-backend-database.md`.

Target tabel:

- [x] `profiles`
- [x] `source_configs`
- [x] `source_accounts`
- [x] `canonical_tracks`
- [x] `source_tracks`
- [x] `playlists`
- [x] `playlist_items`
- [x] `devices`
- [x] `local_assets`
- [x] `play_history`

## Phase 4 - Mobile Music UX

- [x] Home screen.
- [x] Search screen.
- [x] Library screen.
- [x] Playlists screen.
- [x] Settings screen.
- [x] Redesign music app shell: tab icons, branded auth, dashboard, visual library cards, and persistent mini player.
- [x] Real music search untuk public sources awal: Deezer dan Audius, dengan Jamendo optional via env client id.
- [x] Save hasil search ke playlist default lewat RPC backend aman, tanpa membuka write permission katalog global ke mobile.
- [x] Playlist create/edit flow.
- [x] Source enable/disable flow.
- [ ] Recently played flow.

## Phase 5 - Player

- [ ] Install React Native Track Player.
- [ ] Buat Expo development build.
- [ ] Setup playback service.
- [ ] Buat mini player.
- [ ] Buat full player screen.
- [ ] Buat queue screen.
- [ ] Tes local file playback.
- [ ] Tes remote stream legal.
- [ ] Tes background playback dan lock screen controls.
