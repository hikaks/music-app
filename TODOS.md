# Harmonix Mobile Version - TODOs

Tanggal: 2026-06-06

Dokumen ini diturunkan dari `BLUEPRINT.md` dan dibuat sebagai checklist eksekusi. Checklist ini sengaja disusun berurutan agar implementasi tidak lompat terlalu cepat ke fitur source/playback sebelum fondasi auth, API, dan database siap.

## Status Legend

- `[ ]` Belum dikerjakan
- `[~]` Sedang dikerjakan
- `[x]` Selesai
- `[!]` Butuh keputusan / berisiko

## Immediate Next Actions

Prioritas paling awal sebelum coding besar:

- [x] Putuskan package manager: rekomendasi `pnpm`.
- [x] Putuskan deployment awal untuk PostgreSQL: local Docker dulu, lalu pilih Neon/Supabase/Railway/Prisma Postgres.
- [x] Putuskan auth final: rekomendasi Better Auth + Prisma adapter.
- [ ] Putuskan scope MVP source: rekomendasi Local + Jamendo + Audius + Deezer preview.
- [ ] Putuskan apakah target awal Android-first atau langsung Android + iOS.
- [x] Tentukan app scheme mobile: rekomendasi `harmonix`.
- [x] Tentukan nama package Android dan bundle identifier iOS.
- [ ] Tentukan apakah desktop Harmonix nanti ikut memakai backend cloud sync.
- [x] Buat `.env.example` untuk API dan mobile.
- [x] Buat README singkat untuk cara menjalankan mobile-version.

## Phase 0 - Final Decision and Scaffold Prep

Tujuan: membuat struktur awal monorepo yang siap dipakai mobile + API + shared packages.

### Repository Setup

- [x] Buat `mobile-version/package.json` root.
- [x] Buat `mobile-version/pnpm-workspace.yaml`.
- [x] Buat `mobile-version/turbo.json` atau script workspace sederhana.
- [x] Buat folder `apps/mobile`.
- [x] Buat folder `apps/api`.
- [x] Buat folder `packages/shared`.
- [x] Buat folder `packages/database`.
- [x] Buat folder `packages/config`.
- [x] Tambahkan root scripts:
  - [x] `dev`
  - [x] `dev:mobile`
  - [x] `dev:api`
  - [x] `typecheck`
  - [x] `lint`
  - [x] `test`
  - [x] `db:migrate`
  - [x] `db:studio`

### Shared Types

- [x] Salin konsep type dari desktop ke `packages/shared/src/music.types.ts`.
- [x] Definisikan `Artist`.
- [x] Definisikan `Album`.
- [x] Definisikan `Track`.
- [x] Definisikan `Playlist`.
- [x] Definisikan `SearchResult`.
- [x] Definisikan `StreamInfo`.
- [x] Definisikan `SourceCapabilities`.
- [x] Definisikan `MusicSourceId`.
- [x] Tambahkan Zod schema untuk payload API utama.
- [x] Export semua shared types dari `packages/shared/src/index.ts`.

### Acceptance Criteria

- [x] `pnpm install` berhasil.
- [x] `pnpm typecheck` berhasil untuk package kosong/awal.
- [x] Mobile app placeholder bisa start.
- [x] API placeholder bisa start.
- [x] Shared package bisa diimport oleh mobile dan API.

## Phase 1 - Backend Foundation

Tujuan: API, Prisma, PostgreSQL, dan auth protected route siap.

### PostgreSQL and Prisma

- [x] Buat `docker-compose.yml` untuk PostgreSQL lokal.
- [x] Buat `packages/database/prisma/schema.prisma`.
- [x] Konfigurasi datasource PostgreSQL.
- [x] Konfigurasi Prisma Client generator.
- [x] Buat `packages/database/src/client.ts`.
- [x] Tambahkan env `DATABASE_URL`.
- [x] Buat migration awal.
- [x] Tambahkan Prisma Studio script.
- [ ] Tambahkan seed script minimal jika perlu.

### Initial Prisma Models

- [x] Tambahkan model auth dari Better Auth generator/adapter.
- [x] Tambahkan `Profile`.
- [x] Tambahkan enum `MusicSourceId`.
- [x] Tambahkan `SourceConfig`.
- [x] Tambahkan `SourceAccount`.
- [x] Tambahkan `CanonicalTrack`.
- [x] Tambahkan `SourceTrack`.
- [x] Tambahkan `Playlist`.
- [x] Tambahkan `PlaylistItem`.
- [x] Tambahkan `Device`.
- [x] Tambahkan `LocalAsset`.
- [x] Tambahkan `PlayHistory`.
- [x] Tambahkan index dan unique constraints sesuai blueprint.

### API Scaffold

- [x] Setup Hono di `apps/api`.
- [x] Buat `src/index.ts`.
- [x] Buat route `GET /health`.
- [x] Buat env loader/validator.
- [x] Buat error handling middleware.
- [x] Buat request logging middleware.
- [x] Buat auth middleware placeholder.
- [x] Buat module folder:
  - [x] `auth`
  - [x] `users`
  - [x] `sources`
  - [x] `search`
  - [x] `playlists`
  - [x] `playback`
  - [x] `library`
  - [x] `sync`

### Better Auth

- [x] Install Better Auth.
- [x] Install Prisma adapter.
- [x] Setup `apps/api/src/auth/auth.ts`.
- [x] Mount route `GET/POST /auth/*`.
- [x] Aktifkan email/password untuk MVP.
- [x] Tambahkan trusted origins untuk mobile/dev.
- [x] Tambahkan app scheme deep link ke trusted origins jika dibutuhkan.
- [ ] Pastikan session bisa dibaca dari protected API routes.

### User API

- [x] Buat `GET /v1/me`.
- [x] Buat `PATCH /v1/me/profile`.
- [x] Buat `GET /v1/me/devices`.
- [x] Buat `POST /v1/me/devices`.
- [x] Buat `DELETE /v1/me/devices/:id`.

### Acceptance Criteria

- [x] `GET /health` return OK.
- [ ] Prisma migration berhasil apply ke PostgreSQL lokal.
- [ ] User bisa sign up/sign in via Better Auth route.
- [x] `GET /v1/me` reject anonymous request.
- [ ] `GET /v1/me` return user untuk valid session.
- [x] Tidak ada secret yang diexpose ke mobile env.

## Phase 2 - Mobile Auth Shell

Tujuan: mobile app punya routing, auth, session persistence, dan protected tabs.

### Expo App Setup

- [ ] Scaffold Expo app di `apps/mobile`.
- [ ] Gunakan TypeScript.
- [ ] Setup Expo Router.
- [ ] Setup `app/_layout.tsx`.
- [ ] Setup route group `(auth)`.
- [ ] Setup route group `(tabs)`.
- [ ] Setup app scheme `harmonix`.
- [ ] Setup `app.json` / `app.config.ts`.
- [ ] Setup EAS config awal.

### Mobile Dependencies

- [ ] Install Better Auth Expo client.
- [ ] Install Expo SecureStore.
- [ ] Install TanStack Query.
- [ ] Install Zustand.
- [ ] Install NativeWind.
- [ ] Install Expo Linking/WebBrowser jika social auth nanti dipakai.
- [ ] Install React Native safe area dependencies sesuai Expo template.

### Auth Screens

- [ ] Buat `app/(auth)/sign-in.tsx`.
- [ ] Buat `app/(auth)/sign-up.tsx`.
- [ ] Buat `app/(auth)/forgot-password.tsx`.
- [ ] Buat auth client wrapper di `src/lib/auth-client.ts`.
- [ ] Buat `src/features/auth/AuthProvider.tsx`.
- [ ] Buat loading/session bootstrap state.
- [ ] Redirect signed-in user ke tabs.
- [ ] Redirect signed-out user ke auth screen.
- [ ] Tambahkan logout action.

### Protected Tabs

- [ ] Buat tab Home.
- [ ] Buat tab Search.
- [ ] Buat tab Library.
- [ ] Buat tab Playlists.
- [ ] Buat tab Settings.
- [ ] Tambahkan basic top-level navigation guard.
- [ ] Tambahkan TanStack Query provider.
- [ ] Tambahkan basic API client dengan base URL env.

### Acceptance Criteria

- [ ] App bisa dibuka di development build.
- [ ] User bisa sign up dari mobile.
- [ ] User bisa sign in dari mobile.
- [ ] Session tetap ada setelah app restart.
- [ ] Logout menghapus session.
- [ ] Mobile bisa memanggil `GET /v1/me`.

## Phase 3 - Player Foundation

Tujuan: mobile player bisa play local/remote sample dengan queue dan background controls.

### Track Player Setup

- [ ] Install React Native Track Player.
- [ ] Buat Expo development build.
- [ ] Setup playback service.
- [ ] Setup background playback config untuk Android.
- [ ] Setup background audio capability untuk iOS.
- [ ] Buat `src/lib/player/trackPlayer.ts`.
- [ ] Buat player initialization flow.
- [ ] Tambahkan lock screen metadata update.
- [ ] Tambahkan Bluetooth/media control event handlers.

### Player Store and UI

- [ ] Buat `src/stores/playerStore.ts`.
- [ ] Buat queue state.
- [ ] Buat current track state.
- [ ] Buat playback state sync dari Track Player event.
- [ ] Buat `MiniPlayer`.
- [ ] Buat full player screen `app/player/index.tsx`.
- [ ] Buat queue screen `app/player/queue.tsx`.
- [ ] Tambahkan controls:
  - [ ] Play/pause
  - [ ] Next
  - [ ] Previous
  - [ ] Seek
  - [ ] Volume jika supported
  - [ ] Shuffle
  - [ ] Repeat

### Sample Playback

- [ ] Tambahkan sample local asset untuk dev.
- [ ] Tambahkan sample remote stream legal untuk dev.
- [ ] Buat helper convert `StreamInfo` ke Track Player track.
- [ ] Tes play local sample.
- [ ] Tes play remote sample.

### Acceptance Criteria

- [ ] Play/pause berhasil.
- [ ] Seek berhasil.
- [ ] Queue next/previous berhasil.
- [ ] Background playback Android berhasil.
- [ ] Lock screen metadata tampil di Android.
- [ ] iOS background playback test plan siap.
- [ ] Tidak ada crash saat audio interruption sederhana.

## Phase 4 - Source Adapter API

Tujuan: API bisa search source legal/stabil dan mobile bisa menampilkan hasilnya.

### Source Contract

- [ ] Buat backend `SourceAdapter` interface.
- [ ] Buat `SourceCapabilities`.
- [ ] Buat source registry.
- [ ] Buat source enable/disable config dari database.
- [ ] Buat timeout wrapper per source.
- [ ] Buat normalization helper ke shared `Track`.
- [ ] Buat source error mapping.

### Jamendo

- [ ] Implement Jamendo client.
- [ ] Implement Jamendo search tracks.
- [ ] Implement Jamendo playback resolve.
- [ ] Simpan result ke `SourceTrack`.
- [ ] Tambahkan adapter tests.

### Audius

- [ ] Implement Audius client.
- [ ] Implement Audius search tracks.
- [ ] Implement Audius trending jika mudah.
- [ ] Implement Audius playback resolve.
- [ ] Simpan result ke `SourceTrack`.
- [ ] Tambahkan adapter tests.

### Deezer Preview

- [ ] Implement Deezer client.
- [ ] Implement Deezer search tracks.
- [ ] Implement Deezer preview playback resolve.
- [ ] Tandai playbackKind sebagai `preview`.
- [ ] Tambahkan adapter tests.

### Unified Search API

- [ ] Buat `GET /v1/search`.
- [ ] Support query `q`.
- [ ] Support filter `sources`.
- [ ] Fan out parallel ke enabled sources.
- [ ] Return grouped source results.
- [ ] Pastikan failed source tidak menggagalkan semua hasil.
- [ ] Tambahkan rate limit.

### Mobile Search UI

- [ ] Buat search input.
- [ ] Buat source filter chips.
- [ ] Buat grouped results.
- [ ] Buat source badge.
- [ ] Buat action play.
- [ ] Buat action add to queue.
- [ ] Buat action add to playlist placeholder.
- [ ] Tambahkan empty/error/loading states.

### Acceptance Criteria

- [ ] Search Jamendo berhasil.
- [ ] Search Audius berhasil.
- [ ] Search Deezer preview berhasil.
- [ ] Result bisa diputar jika playback URL valid.
- [ ] Source error tampil informatif, bukan crash.
- [ ] API menyimpan cache `SourceTrack`.

## Phase 5 - Playlists and Cloud Sync

Tujuan: user bisa membuat playlist cloud lintas source.

### Playlist API

- [ ] Buat `GET /v1/playlists`.
- [ ] Buat `POST /v1/playlists`.
- [ ] Buat `GET /v1/playlists/:id`.
- [ ] Buat `PATCH /v1/playlists/:id`.
- [ ] Buat `DELETE /v1/playlists/:id`.
- [ ] Buat `POST /v1/playlists/:id/items`.
- [ ] Buat `DELETE /v1/playlists/:id/items/:itemId`.
- [ ] Buat `POST /v1/playlists/:id/reorder`.
- [ ] Tambahkan transaction-safe reorder.
- [ ] Tambahkan authorization by `userId`.

### Playlist Mobile UI

- [ ] Buat playlists list screen.
- [ ] Buat create playlist flow.
- [ ] Buat rename playlist flow.
- [ ] Buat delete confirmation.
- [ ] Buat playlist detail screen.
- [ ] Buat add-to-playlist modal.
- [ ] Buat remove track action.
- [ ] Buat reorder UI.
- [ ] Buat play all action.

### Acceptance Criteria

- [ ] Playlist tersimpan di PostgreSQL.
- [ ] Playlist muncul lagi setelah app restart.
- [ ] Mixed-source tracks bisa masuk playlist.
- [ ] User tidak bisa akses playlist user lain.
- [ ] Reorder tidak membuat duplicate position.
- [ ] Play all mengisi queue.

## Phase 6 - Local Library

Tujuan: user bisa import/pilih audio lokal dan sync metadata aman ke backend.

### Local File Access

- [ ] Tentukan strategi awal: file picker manual atau Android media scan.
- [ ] Install Expo DocumentPicker.
- [ ] Install Expo FileSystem.
- [ ] Install Expo MediaLibrary jika dibutuhkan.
- [ ] Buat permission request flow.
- [ ] Buat denied permission state.
- [ ] Buat local file import action.
- [ ] Buat local metadata extraction strategy.
- [ ] Buat local artwork cache strategy.

### Local Cache

- [ ] Setup Expo SQLite atau alternatif cache.
- [ ] Buat local tracks table/cache.
- [ ] Simpan local URI secara device-local.
- [ ] Simpan safe metadata untuk sync.
- [ ] Buat local library query.
- [ ] Buat local search.

### Local Sync API

- [ ] Buat `GET /v1/library/local-assets`.
- [ ] Buat `POST /v1/library/local-assets/bulk-upsert`.
- [ ] Buat `POST /v1/library/local-assets/remove`.
- [ ] Hash local key sebelum sync.
- [ ] Jangan kirim raw sensitive path ke server.

### Local Library UI

- [ ] Buat import button.
- [ ] Buat local tracks list.
- [ ] Buat albums/artists grouping jika metadata cukup.
- [ ] Buat play local track.
- [ ] Buat remove local asset.

### Acceptance Criteria

- [ ] User bisa import audio lokal.
- [ ] Track tampil di Library.
- [ ] Track lokal bisa diputar.
- [ ] Metadata bertahan setelah app restart.
- [ ] Server hanya menerima metadata aman/hash.
- [ ] Permission denied tidak membuat app rusak.

## Phase 7 - Spotify and Premium Source Features

Tujuan: Spotify metadata/account masuk dengan batasan playback mobile yang jelas.

### Spotify Account

- [ ] Buat Spotify OAuth route di backend.
- [ ] Tambahkan scopes minimal.
- [ ] Simpan token terenkripsi di `SourceAccount`.
- [ ] Implement refresh token flow.
- [ ] Buat connect/disconnect source API.
- [ ] Buat mobile source auth status.

### Spotify Metadata

- [ ] Implement Spotify search.
- [ ] Implement Spotify get track.
- [ ] Implement Spotify liked tracks jika scope tersedia.
- [ ] Implement Spotify user playlists jika scope tersedia.
- [ ] Simpan result ke `SourceTrack`.

### Spotify Playback Decision

- [!] Putuskan playback fase awal:
  - [ ] Open in Spotify app/deep link.
  - [ ] Preview fallback jika ada preview URL.
  - [ ] Native App Remote SDK via custom native module.
- [ ] Tampilkan limitation message di UI.
- [ ] Jangan mengklaim in-app Spotify playback jika belum valid.

### Acceptance Criteria

- [ ] Spotify connect berhasil di mobile.
- [ ] Token refresh berhasil.
- [ ] Search Spotify metadata berhasil.
- [ ] Playback limitation jelas di UI.
- [ ] Tidak ada Spotify secret di mobile bundle.

## Phase 8 - Release Hardening

Tujuan: app siap internal test dan tidak gagal karena masalah auth, privacy, atau source legal.

### Build and Release

- [ ] Setup EAS development profile.
- [ ] Setup EAS preview/internal profile.
- [ ] Setup EAS production profile.
- [ ] Build Android internal test.
- [ ] Build iOS TestFlight.
- [ ] Setup app icons.
- [ ] Setup splash screen.
- [ ] Setup app versioning.

### Monitoring

- [ ] Tambahkan Sentry atau monitoring sejenis di mobile.
- [ ] Tambahkan API logging production-safe.
- [ ] Tambahkan API error tracking.
- [ ] Tambahkan health check untuk database.
- [ ] Tambahkan basic metrics untuk source failures.

### Privacy and Legal

- [ ] Buat privacy policy.
- [ ] Buat terms/disclaimer.
- [ ] Buat source-specific legal notes.
- [ ] Buat account deletion flow.
- [ ] Review Android media permission justification.
- [ ] Review iOS background audio justification.
- [ ] Pastikan YouTube Music tidak aktif untuk public MVP.
- [ ] Pastikan social login mengikuti aturan Apple/Google.

### Acceptance Criteria

- [ ] Android internal build install berhasil.
- [ ] iOS TestFlight build install berhasil.
- [ ] Login/logout bekerja di build non-dev.
- [ ] Background audio bekerja sesuai klaim.
- [ ] Privacy/account deletion flow tersedia.
- [ ] Tidak ada high-risk source extraction di public build.

## Cross-Cutting TODOs

### Security

- [ ] Enforce HTTPS di production.
- [ ] Tambahkan rate limit untuk auth.
- [ ] Tambahkan rate limit untuk search.
- [ ] Enkripsi token source provider sebelum database write.
- [ ] Jangan log token/session.
- [ ] Validasi semua request body dengan Zod.
- [ ] Filter semua data user by authenticated `userId`.
- [ ] Tambahkan tests untuk unauthorized access.

### Testing

- [ ] Setup Vitest untuk API.
- [ ] Setup test database.
- [ ] Test Prisma migrations.
- [ ] Test auth protected routes.
- [ ] Test playlist CRUD.
- [ ] Test playlist reorder transaction.
- [ ] Test source adapter timeout.
- [ ] Setup React Native Testing Library.
- [ ] Test auth provider mobile.
- [ ] Test player store.
- [ ] Test queue behavior.
- [ ] Buat manual QA checklist device.

### Documentation

- [ ] Buat `mobile-version/README.md`.
- [ ] Dokumentasikan local dev setup.
- [ ] Dokumentasikan env vars.
- [ ] Dokumentasikan database migration flow.
- [ ] Dokumentasikan auth flow.
- [ ] Dokumentasikan source limitations.
- [ ] Dokumentasikan release flow.
- [ ] Dokumentasikan known risks.

### Design and UX

- [ ] Definisikan design tokens warna.
- [ ] Definisikan typography scale.
- [ ] Definisikan spacing scale.
- [ ] Buat source badge colors.
- [ ] Buat empty states.
- [ ] Buat loading states.
- [ ] Buat error states.
- [ ] Pastikan player controls nyaman di layar kecil.
- [ ] Pastikan tap target mobile cukup besar.
- [ ] Pastikan text tidak overflow di track row.

## Risk Register TODOs

- [!] YouTube Music mobile streaming: jangan implement untuk public MVP sampai legal path jelas.
- [!] Spotify in-app playback: perlu keputusan antara external/deep link, preview, atau native App Remote.
- [!] Local file scanning iOS: kemungkinan lebih terbatas daripada Android.
- [!] React Native Track Player + Expo: wajib development build dan device testing.
- [!] NativeWind compatibility: cek versi Expo/RN saat scaffold.
- [!] Background audio store review: permission dan wording harus sesuai fitur nyata.

## Definition of Done for MVP

MVP dianggap selesai jika:

- [ ] User bisa sign up/sign in dari mobile.
- [ ] Session persistent di device.
- [ ] User bisa search minimal 2 source legal/stabil.
- [ ] User bisa play minimal 1 source remote legal.
- [ ] User bisa import dan play local audio.
- [ ] User bisa membuat playlist cloud lintas source.
- [ ] User bisa add/remove/reorder playlist items.
- [ ] Queue dan mini player berfungsi.
- [ ] Background playback berfungsi di Android internal build.
- [ ] API memakai PostgreSQL + Prisma migration.
- [ ] Semua route user data terlindungi auth.
- [ ] Android internal test build berhasil.
- [ ] YouTube Music extraction tidak aktif di public build.
