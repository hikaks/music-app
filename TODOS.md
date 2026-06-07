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
- [ ] Ambil dan simpan anon key di env lokal mobile.
- [x] Jalankan typecheck setelah lockfile dirapikan.

## Phase 1 - Mobile Foundation

- [x] Pertahankan Expo app di `apps/mobile`.
- [x] Pertahankan shared music/source types di `packages/shared`.
- [x] Siapkan `src/lib/insforge.ts`.
- [ ] Validasi `@insforge/sdk` di React Native runtime.
- [ ] Buat app shell dengan route group auth dan tabs.
- [ ] Buat theme tokens untuk mobile UI.
- [ ] Tambahkan TanStack Query bila mulai ada server state kompleks.
- [ ] Tambahkan Expo SecureStore bila session/token perlu persist manual.

## Phase 2 - InsForge Auth

- [ ] Pastikan auth config InsForge cocok untuk mobile.
- [ ] Tambahkan redirect URL/scheme mobile jika OAuth dipakai.
- [ ] Buat screen sign in.
- [ ] Buat screen sign up.
- [ ] Buat screen verify email code.
- [ ] Buat logout action.
- [ ] Buat guard untuk signed-in dan signed-out state.

## Phase 3 - InsForge Database Musik

- [!] Backend aktif belum berisi schema Harmonix dan masih berisi tabel non-Harmonix.
- [ ] Putuskan memakai project InsForge aktif atau project baru khusus Harmonix.
- [ ] Buat migration untuk tabel musik snake_case.
- [ ] Buat RLS untuk semua tabel user-scoped.
- [ ] Verifikasi policy sebagai authenticated user, bukan admin key.
- [ ] Dokumentasikan setiap tabel di `docs/insforge-backend-database.md`.

Target tabel:

- [ ] `profiles`
- [ ] `source_configs`
- [ ] `source_accounts`
- [ ] `canonical_tracks`
- [ ] `source_tracks`
- [ ] `playlists`
- [ ] `playlist_items`
- [ ] `devices`
- [ ] `local_assets`
- [ ] `play_history`

## Phase 4 - Mobile Music UX

- [ ] Home screen.
- [ ] Search screen.
- [ ] Library screen.
- [ ] Playlists screen.
- [ ] Settings screen.
- [ ] Playlist create/edit flow.
- [ ] Source enable/disable flow.
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
