# Harmonix Mobile Version - Blueprint Planning

Tanggal: 2026-06-06

Status: blueprint awal. Dokumen ini belum membuat aplikasi mobile, hanya rencana teknis detail untuk memulai versi mobile dari Harmonix.

## 1. Ringkasan Keputusan

Harmonix mobile sebaiknya dibuat sebagai aplikasi baru, bukan port langsung dari Electron. Kode desktop saat ini punya banyak konsep yang masih bisa dipakai ulang, terutama `Track`, `Album`, `Playlist`, source adapter, queue, search, dan playlist lintas sumber. Namun bagian Electron main process, `sql.js`, file scanner desktop, Web Audio equalizer, dan IPC harus diganti dengan arsitektur mobile + backend API.

Keputusan utama:

| Area | Pilihan utama | Alasan |
|---|---|---|
| Mobile app | Expo + React Native + TypeScript | Paling cepat untuk iOS/Android, tetap dekat dengan React/TypeScript yang sudah dipakai di desktop. |
| Routing | Expo Router | File-based routing, deep link bawaan, cocok untuk app mobile modern. |
| Audio player | React Native Track Player | Dibuat untuk music app, queue, background playback, lock screen controls, local/network stream. |
| Backend API | TypeScript API dengan Hono di Node.js | Ringan, type-safe, cocok untuk mobile API, mudah dipisah dari client. |
| Database | PostgreSQL + Prisma ORM | Sesuai request, type-safe, migration jelas, cocok untuk cloud sync. |
| Auth utama | Better Auth + Prisma adapter + Expo integration | User/session disimpan di PostgreSQL sendiri, cocok dengan Prisma, tidak bergantung penuh ke BaaS. |
| Auth alternatif | Clerk | Lebih cepat dan matang untuk auth managed, tapi data auth utama berada di Clerk, bukan PostgreSQL milik app. |
| Server state | TanStack Query | Cocok untuk data fetching/cache di React Native. |
| UI styling | NativeWind + design tokens | Dekat dengan Tailwind yang sudah dipakai di desktop, tapi harus cek kompatibilitas Expo SDK saat scaffold. |
| Local secure storage | Expo SecureStore | Untuk session/token kecil di device. |
| Local cache/index | Expo SQLite atau MMKV/AsyncStorage | Untuk offline cache dan metadata lokal, bukan pengganti PostgreSQL. |

## 2. Tujuan Produk Mobile

Tujuan MVP:

1. User bisa login dan data playlist tersimpan di cloud.
2. User bisa search lagu dari beberapa source yang legal dan stabil untuk mobile.
3. User bisa membuat playlist yang berisi track dari beberapa source.
4. User bisa play track yang memang bisa diputar secara legal dari app mobile.
5. User bisa melihat queue, now playing, source badge, dan metadata track.
6. User bisa import/pilih local audio file di device, minimal sebagai fitur Android-first atau file-picker based.
7. App bisa berjalan di iOS dan Android melalui EAS development build.

Non-goals MVP:

1. Tidak memaksakan semua fitur desktop langsung tersedia.
2. Tidak menjanjikan YouTube Music streaming di mobile store release karena risiko ToS dan review app store.
3. Tidak menjanjikan equalizer 10-band di fase awal, karena Web Audio API desktop tidak bisa dipindahkan langsung ke React Native.
4. Tidak mengakses database langsung dari mobile app. Prisma berjalan di backend, bukan di client React Native.
5. Tidak menyimpan secret Spotify/Jamendo/SoundCloud di env public Expo.

## 3. Prinsip Arsitektur

### 3.1 Aplikasi Mobile Tidak Menyentuh Database Langsung

Prisma ORM berjalan di runtime server seperti Node.js, Bun, atau Deno. Mobile app tidak boleh membawa Prisma Client dan tidak boleh memegang `DATABASE_URL`.

Alur yang benar:

```text
Expo mobile app
  -> HTTPS API
    -> auth middleware
      -> Prisma Client
        -> PostgreSQL
```

### 3.2 Source Adapter Dipindah ke Backend dan Mobile

Tidak semua source adapter bisa tinggal di satu tempat.

| Source | Tempat utama | Catatan |
|---|---|---|
| Local files | Mobile client | File URI dan permission device tidak boleh dianggap global. Metadata bisa disinkronkan sebagian. |
| Spotify metadata | Backend API | Search, track, playlist via Web API dari backend. |
| Spotify playback | Mobile native/external | Opsi: Spotify App Remote SDK/custom native module, deep link ke Spotify, atau preview URL jika tersedia. |
| YouTube Music | Deferred/experimental backend | Tidak ada API resmi khusus YouTube Music. Streaming extraction berisiko tinggi untuk release publik. |
| Deezer | Backend API | Cocok untuk preview/metadata sesuai API. |
| Jamendo | Backend API | Cocok untuk full CC-licensed streaming, prioritas bagus untuk MVP. |
| Audius | Backend API | Cocok untuk streaming legal dari API publik. |
| SoundCloud | Backend API | Butuh client id dan validasi Terms/API access. |

### 3.3 Shared Types Harus Dikeluarkan dari Desktop

Tipe dari desktop seperti `Track`, `Album`, `Artist`, `Playlist`, `SearchResult`, `StreamInfo`, dan `SourceCapabilities` sebaiknya dipindahkan ke package shared agar API dan mobile menggunakan kontrak yang sama.

## 4. Rekomendasi Struktur Monorepo

Target folder setelah implementasi:

```text
mobile-version/
  README.md
  BLUEPRINT.md
  package.json
  pnpm-workspace.yaml
  turbo.json
  apps/
    mobile/
      app/
        (auth)/
        (tabs)/
        player/
        source/
      src/
        components/
        features/
        hooks/
        lib/
        stores/
      app.json
      eas.json
    api/
      src/
        index.ts
        auth/
        modules/
          users/
          sources/
          search/
          playlists/
          playback/
          library/
          sync/
        middleware/
        jobs/
      Dockerfile
  packages/
    database/
      prisma/
        schema.prisma
        migrations/
      src/
        client.ts
    shared/
      src/
        music.types.ts
        api.types.ts
        source.types.ts
        zod.ts
    config/
      eslint/
      tsconfig/
```

Kenapa monorepo:

1. Mobile dan API bisa berbagi type tanpa copy-paste.
2. Prisma schema terisolasi di `packages/database`.
3. Source adapter contract bisa dipakai oleh API, tests, dan mungkin desktop di masa depan.
4. Lebih mudah jika nanti desktop juga ingin memakai backend cloud sync yang sama.

## 5. Tech Stack Detail

### 5.1 Mobile Client

Rekomendasi:

- Expo SDK 56 atau versi terbaru yang stabil saat scaffold.
- React Native + TypeScript.
- Expo Router untuk routing.
- React Native Track Player untuk audio engine utama.
- Zustand untuk UI/player state lokal, supaya konsisten dengan desktop.
- TanStack Query untuk server state.
- NativeWind untuk utility styling.
- Expo SecureStore untuk session/auth cookie/token kecil.
- Expo SQLite untuk local library cache dan offline metadata.
- Expo DocumentPicker, FileSystem, dan MediaLibrary untuk local audio import/index.
- Expo Notifications untuk push notification, jika dibutuhkan nanti.
- EAS Build untuk development build dan release.

Catatan penting:

1. React Native Track Player bisa dipakai dengan Expo, tetapi butuh development build, bukan hanya Expo Go.
2. Background playback dan lock screen controls harus dites di device asli, terutama iOS.
3. Jika ingin full lock screen/audio service yang stabil, jangan mengandalkan Expo Go.

### 5.2 Backend API

Rekomendasi:

- Node.js 20+.
- Hono sebagai API framework.
- Zod untuk request/response validation.
- Prisma Client untuk database.
- Better Auth route mounted di API.
- Redis/Upstash optional untuk rate limit, cache search, dan job state.
- Background jobs optional: BullMQ/Graphile Worker/Cloud queue, tergantung deployment.

Kenapa Hono:

1. Ringan untuk mobile API.
2. TypeScript-first.
3. Bisa membuat RPC-style client dengan shared types.
4. Tidak terlalu berat untuk tahap awal dibanding NestJS.

Kapan pindah ke NestJS:

1. Jika modul backend mulai sangat besar.
2. Jika butuh dependency injection formal, guards, scheduled jobs, dan modul enterprise.
3. Jika tim berkembang dan butuh struktur lebih ketat.

### 5.3 Database

Wajib:

- PostgreSQL.
- Prisma ORM.
- Prisma Migrate.
- Prisma Studio untuk inspeksi lokal.

Provider PostgreSQL yang cocok:

| Provider | Cocok jika | Catatan |
|---|---|---|
| Neon | Ingin serverless Postgres murah dan cepat | Perhatikan connection pooling. |
| Supabase Postgres | Ingin Postgres plus dashboard/storage/realtime optional | Auth Supabase tidak dipakai jika memilih Better Auth. |
| Prisma Postgres | Ingin integrasi paling dekat dengan Prisma | Cocok untuk awal jika pricing cocok. |
| Railway/Fly/Render Postgres | Ingin deployment API dan DB di satu platform | Simpel untuk MVP. |

### 5.4 Authentication

Pilihan utama: Better Auth.

Rancangan:

1. Better Auth disetup di backend API.
2. Prisma adapter menyimpan tabel auth di PostgreSQL.
3. Expo app memakai Better Auth Expo client.
4. Session/cookie disimpan di Expo SecureStore.
5. Deep link scheme misalnya `harmonix://auth/callback`.
6. Email/password diaktifkan untuk MVP.
7. Social auth ditambahkan setelah Apple Sign In readiness jelas.

Kenapa bukan custom JWT sendiri:

1. Refresh/session lifecycle rawan salah.
2. OAuth mobile deep link rawan edge case.
3. Better Auth sudah punya integrasi Expo dan Prisma.

Alternatif managed: Clerk.

Gunakan Clerk jika:

1. Ingin sign-in UI dan social auth paling cepat.
2. Tidak masalah user auth utama ada di layanan Clerk.
3. Backend cukup memverifikasi Clerk JWT lalu membuat mirror `Profile` di PostgreSQL.

Supabase Auth:

Masuk akal jika nanti ingin memakai Supabase sebagai platform penuh. Namun untuk request ini, Prisma/PostgreSQL sebagai pusat data lebih cocok dengan Better Auth atau Clerk + Prisma.

## 6. Rancangan Database Prisma

Catatan: nama model auth Better Auth sebaiknya mengikuti generator/adapter resmi. Jangan terlalu banyak mengubah model auth sebelum setup aktual.

### 6.1 Auth Models

Disediakan/dikelola oleh Better Auth:

- `User`
- `Session`
- `Account`
- `Verification`

Tambahan app-specific:

```prisma
model Profile {
  id          String   @id @default(cuid())
  userId      String   @unique
  displayName String?
  imageUrl    String?
  country     String?
  locale      String   @default("id-ID")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 6.2 Source Account dan Config

```prisma
enum MusicSourceId {
  local
  spotify
  ytmusic
  deezer
  jamendo
  audius
  soundcloud
}

model SourceConfig {
  id        String        @id @default(cuid())
  userId    String
  source    MusicSourceId
  enabled   Boolean       @default(true)
  settings  Json          @default("{}")
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, source])
  @@index([userId, enabled])
}

model SourceAccount {
  id                    String        @id @default(cuid())
  userId                String
  source                MusicSourceId
  externalUserId         String?
  externalUserName       String?
  accessTokenEncrypted   String?
  refreshTokenEncrypted  String?
  expiresAt             DateTime?
  scopes                String[]      @default([])
  status                String        @default("active")
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  user                  User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, source])
  @@index([source, externalUserId])
}
```

Token source pihak ketiga harus dienkripsi di backend sebelum masuk database. Mobile app tidak menyimpan token provider selain session app sendiri.

### 6.3 Track dan Metadata

```prisma
model CanonicalTrack {
  id              String        @id @default(cuid())
  isrc            String?
  normalizedTitle String
  normalizedArtist String
  durationMs      Int?
  artworkUrl      String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  sources         SourceTrack[]

  @@index([isrc])
  @@index([normalizedTitle, normalizedArtist])
}

model SourceTrack {
  id               String        @id @default(cuid())
  source           MusicSourceId
  sourceId         String
  canonicalTrackId String?
  title            String
  artists          Json
  album            Json?
  durationMs       Int?
  artworkUrl       String?
  previewUrl       String?
  externalUrl      String?
  isPlayable       Boolean       @default(false)
  playbackKind     String        @default("unknown")
  meta             Json          @default("{}")
  lastFetchedAt    DateTime      @default(now())
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  canonicalTrack   CanonicalTrack? @relation(fields: [canonicalTrackId], references: [id])
  playlistItems    PlaylistItem[]
  playHistory      PlayHistory[]

  @@unique([source, sourceId])
  @@index([source, title])
  @@index([canonicalTrackId])
}
```

`CanonicalTrack` dipakai untuk menggabungkan track yang sama dari banyak source. Matching awal bisa pakai ISRC jika ada, lalu fallback title + artist + duration.

### 6.4 Playlist Lintas Source

```prisma
model Playlist {
  id          String         @id @default(cuid())
  userId      String
  name        String
  description String?
  visibility  String         @default("private")
  artworkUrl  String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       PlaylistItem[]

  @@index([userId, updatedAt])
}

model PlaylistItem {
  id         String      @id @default(cuid())
  playlistId String
  trackId    String
  position   Int
  addedById  String?
  addedAt    DateTime    @default(now())

  playlist   Playlist    @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  track      SourceTrack  @relation(fields: [trackId], references: [id], onDelete: Restrict)

  @@unique([playlistId, position])
  @@index([playlistId])
  @@index([trackId])
}
```

Catatan reorder:

1. Jangan update posisi satu per satu tanpa transaksi.
2. Gunakan transaction dan temporary offset seperti desktop sudah lakukan.
3. Untuk playlist besar, pertimbangkan fractional ranking (`rank` string) agar reorder lebih murah.

### 6.5 Device, Local Asset, dan Offline Cache

```prisma
model Device {
  id        String   @id @default(cuid())
  userId    String
  name      String?
  platform  String
  pushToken String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model LocalAsset {
  id             String   @id @default(cuid())
  userId         String
  deviceId       String?
  localKeyHash   String
  title          String
  artist         String?
  album          String?
  durationMs     Int?
  artworkLocalId String?
  fileSize       Int?
  fileMtime      DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, localKeyHash])
  @@index([userId, title])
}
```

Jangan menyimpan raw path lokal yang sensitif di server. Simpan hash/id device-scoped dan metadata umum saja.

### 6.6 Play History

```prisma
model PlayHistory {
  id          String      @id @default(cuid())
  userId      String
  trackId     String
  source      MusicSourceId
  playedAt    DateTime    @default(now())
  durationMs  Int?
  completed   Boolean     @default(false)
  contextType String?
  contextId   String?

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  track       SourceTrack @relation(fields: [trackId], references: [id], onDelete: Restrict)

  @@index([userId, playedAt])
  @@index([trackId])
}
```

## 7. API Blueprint

Base URL:

```text
https://api.harmonix.app
```

### 7.1 Auth

Handled by Better Auth:

```text
GET/POST /auth/*
```

Mobile flow:

1. User membuka sign in screen.
2. App memanggil Better Auth client.
3. Untuk OAuth, Expo WebBrowser/AuthSession membuka provider.
4. Provider redirect ke scheme `harmonix://auth/callback`.
5. Session/cookie disimpan di SecureStore via Better Auth Expo client.
6. Semua API request membawa session header/cookie yang dikelola client.

### 7.2 User

```text
GET    /v1/me
PATCH  /v1/me/profile
GET    /v1/me/devices
POST   /v1/me/devices
DELETE /v1/me/devices/:id
```

### 7.3 Sources

```text
GET   /v1/sources
GET   /v1/sources/enabled
PATCH /v1/sources/:sourceId/config
POST  /v1/sources/:sourceId/connect
POST  /v1/sources/:sourceId/disconnect
GET   /v1/sources/:sourceId/auth-status
GET   /v1/sources/:sourceId/playlists
GET   /v1/sources/:sourceId/liked-tracks
```

### 7.4 Search

```text
GET /v1/search?q=...&sources=jamendo,audius,deezer
GET /v1/search/:searchId/status
```

Search strategy:

1. API validates query.
2. API loads enabled sources.
3. API fans out in parallel with timeout per source.
4. Results normalized into shared `SearchResult`.
5. API stores `SourceTrack` cache for track results.
6. Mobile receives grouped result by source.

### 7.5 Playback

```text
POST /v1/playback/resolve
POST /v1/playback/history
```

`resolve` input:

```json
{
  "source": "jamendo",
  "sourceId": "123",
  "client": {
    "platform": "ios",
    "supports": ["hls", "mp3", "background"]
  }
}
```

`resolve` output:

```json
{
  "url": "https://...",
  "protocol": "http",
  "expiresAt": "2026-06-06T15:00:00.000Z",
  "headers": {},
  "playbackKind": "direct-stream"
}
```

Rules:

1. Return direct stream only when source terms allow it.
2. Never return backend secret.
3. For source with external-only playback, return `playbackKind: "external"` and `externalUrl`.
4. For Spotify, MVP can open Spotify app/deep link or use App Remote in later phase.

### 7.6 Playlists

```text
GET    /v1/playlists
POST   /v1/playlists
GET    /v1/playlists/:id
PATCH  /v1/playlists/:id
DELETE /v1/playlists/:id
POST   /v1/playlists/:id/items
DELETE /v1/playlists/:id/items/:itemId
POST   /v1/playlists/:id/reorder
```

### 7.7 Local Library Sync

```text
GET  /v1/library/local-assets
POST /v1/library/local-assets/bulk-upsert
POST /v1/library/local-assets/remove
```

Mobile tetap sumber kebenaran untuk file lokal. Server hanya menyimpan metadata sinkronisasi user/device.

## 8. Mobile Screen Map

Expo Router target:

```text
apps/mobile/app/
  _layout.tsx
  (auth)/
    sign-in.tsx
    sign-up.tsx
    forgot-password.tsx
  (tabs)/
    _layout.tsx
    index.tsx             # Home
    search.tsx            # Unified search
    library.tsx           # Local/cloud library
    playlists.tsx         # Playlist list
    settings.tsx
  player/
    index.tsx             # Full player
    queue.tsx
  playlist/
    [id].tsx
  source/
    [id].tsx
  modal/
    source-config.tsx
    add-to-playlist.tsx
```

### Home

Fungsi:

1. Continue listening.
2. Recently played.
3. Enabled sources.
4. Quick actions: Search, Import Local Files, Create Playlist.

### Search

Fungsi:

1. Search bar.
2. Source filter chips.
3. Grouped results: Tracks, Albums, Artists, Playlists.
4. Per-result actions: play, add to queue, add to playlist, open source.

### Library

Fungsi:

1. Local tracks.
2. Saved/liked tracks if source supports it.
3. Albums/artists.
4. Device import controls.

### Player

Fungsi:

1. Artwork.
2. Title, artist, source badge.
3. Play/pause/next/previous.
4. Seek bar.
5. Queue button.
6. Repeat/shuffle.
7. Output state: local, remote, external.

### Settings

Fungsi:

1. Account.
2. Connected sources.
3. Source credentials/config.
4. Storage/cache.
5. Legal/disclaimers.
6. Developer diagnostics.

## 9. Playback Strategy

### 9.1 MVP Playback Matrix

| Source | MVP playback | Later |
|---|---|---|
| Local file | React Native Track Player from local URI | Better metadata extraction and artwork cache. |
| Jamendo | Direct legal stream | Offline cache if allowed. |
| Audius | Direct stream/API supported URL | Trending/library sync. |
| Deezer | 30s preview | Account features only if API access allows. |
| SoundCloud | Public stream/preview if API access valid | OAuth if app approval available. |
| Spotify | External open or preview fallback | App Remote SDK/custom native module. |
| YouTube Music | Disabled for public MVP | Experimental dev-only with explicit legal risk. |

### 9.2 Equalizer

Desktop equalizer memakai Web Audio graph. React Native Track Player tidak otomatis memberikan akses DSP yang sama.

Rencana:

1. MVP: tidak ada 10-band EQ.
2. Phase later: riset native equalizer per platform.
3. Jangan tampilkan kontrol EQ jika engine tidak mendukungnya.
4. Simpan preset di PostgreSQL agar siap jika engine tersedia nanti.

## 10. Security Blueprint

1. Mobile hanya menyimpan app session di SecureStore.
2. OAuth token source disimpan di backend, terenkripsi.
3. Semua API memakai HTTPS.
4. CORS hanya untuk origin yang dibutuhkan.
5. API memakai rate limit untuk auth dan search.
6. Secret hanya di backend env.
7. Expo env public hanya boleh berisi `EXPO_PUBLIC_API_BASE_URL`, app scheme, dan non-secret config.
8. Playlist, profile, source config selalu difilter berdasarkan `userId`.
9. Jangan percaya `userId` dari request body.
10. Audit log untuk connect/disconnect source.

## 11. Environment Variables

### Mobile

```env
EXPO_PUBLIC_API_BASE_URL=https://api.harmonix.app
EXPO_PUBLIC_APP_SCHEME=harmonix
```

### API

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:4000
APP_PUBLIC_URL=http://localhost:8081

SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=harmonix://auth/spotify/callback

JAMENDO_CLIENT_ID=...
AUDIUS_HOST=...
SOUNDCLOUD_CLIENT_ID=...
SOUNDCLOUD_CLIENT_SECRET=...

TOKEN_ENCRYPTION_KEY=...
REDIS_URL=...
SENTRY_DSN=...
```

## 12. Migration dari Desktop Harmonix

Yang bisa dipakai ulang:

1. Shared type definitions di `electron/main/sources/types.ts`.
2. Source adapter capability concept.
3. Search fan-out concept.
4. Playlist cross-source model.
5. Queue model dari `playerStore`.
6. UI information architecture: Home, Search, Library, Playlist, Source, Settings.
7. Legal disclaimer pattern untuk YouTube Music.

Yang harus diganti:

1. Electron IPC diganti HTTP API.
2. Electron safeStorage diganti backend encryption + Expo SecureStore.
3. `sql.js` local desktop DB diganti PostgreSQL/Prisma di backend.
4. Desktop file scanner diganti mobile DocumentPicker/MediaLibrary flow.
5. Web Audio equalizer diganti native audio strategy atau dihapus sementara.
6. `yt-dlp` desktop subprocess tidak cocok untuk public mobile app.

## 13. Implementation Roadmap

### Phase 0 - Final Decision and Scaffold Prep

Output:

1. Final stack decision.
2. Monorepo initialized.
3. Shared package created.
4. Environment naming fixed.

Acceptance criteria:

1. `pnpm install` works.
2. `pnpm typecheck` runs across packages.
3. Mobile app starts with placeholder tabs.
4. API starts with `/health`.

### Phase 1 - Backend Foundation

Output:

1. Hono API app.
2. Prisma schema initial.
3. PostgreSQL local via Docker Compose.
4. Better Auth integrated.
5. `/v1/me` protected route.

Acceptance criteria:

1. User can sign up/sign in from API test client.
2. Prisma migration applies cleanly.
3. Protected route rejects anonymous request.
4. Protected route returns user for valid session.

### Phase 2 - Mobile Auth Shell

Output:

1. Expo Router app shell.
2. Sign in/sign up screens.
3. SecureStore session persistence.
4. Authenticated tab layout.

Acceptance criteria:

1. User can sign in on Android emulator/device.
2. User can close app and session remains.
3. Logout clears session.
4. Deep link scheme works in development build.

### Phase 3 - Player Foundation

Output:

1. React Native Track Player installed in development build.
2. Playback service configured.
3. Mini player and full player screens.
4. Queue store.
5. Play local bundled sample and remote sample.

Acceptance criteria:

1. Play/pause/seek works.
2. Background playback works on Android.
3. iOS real-device test plan documented.
4. Lock screen metadata appears where supported.

### Phase 4 - Source Adapter API

Output:

1. Shared `MusicSource` backend interface.
2. Jamendo adapter.
3. Audius adapter.
4. Deezer preview adapter.
5. Unified search endpoint.

Acceptance criteria:

1. Search returns grouped source results.
2. Failed source does not fail entire search.
3. API timeout per source works.
4. Mobile search UI can play supported results.

### Phase 5 - Playlists and Cloud Sync

Output:

1. Playlist CRUD API.
2. Playlist UI.
3. Add to playlist from search.
4. Reorder playlist items.

Acceptance criteria:

1. Playlist persists after app reinstall/login.
2. Mixed-source playlist works.
3. Reorder is transaction-safe.
4. Unauthorized user cannot read/edit another user's playlist.

### Phase 6 - Local Library

Output:

1. File import flow.
2. Local metadata cache.
3. Local asset upsert to backend.
4. Local playback through Track Player.

Acceptance criteria:

1. User can import playable local audio.
2. Track appears in Library.
3. Local metadata survives app restart.
4. Server stores only safe metadata/hash, not sensitive raw path.

### Phase 7 - Spotify and Premium Source Features

Output:

1. Spotify account connect.
2. Spotify search metadata.
3. Spotify liked tracks/playlists if API scopes approved.
4. Playback decision: external deep link vs native App Remote.

Acceptance criteria:

1. OAuth flow works on mobile.
2. Token refresh works.
3. Spotify tracks show correct playback limitation.
4. No Spotify secret in mobile bundle.

### Phase 8 - Release Hardening

Output:

1. EAS profiles.
2. Sentry/monitoring.
3. Privacy policy and legal source disclaimers.
4. Store screenshots/metadata.
5. App review checklist.

Acceptance criteria:

1. Android internal test build installs.
2. iOS TestFlight build installs.
3. No public source uses questionable stream extraction.
4. Auth and account deletion flow documented.

## 14. Testing Strategy

### API

1. Unit tests for source adapters.
2. Integration tests against test PostgreSQL.
3. Auth tests for protected routes.
4. Playlist transaction tests.
5. Search timeout/failure tests.

Tools:

- Vitest.
- Prisma test database.
- Testcontainers optional.

### Mobile

1. Component tests with React Native Testing Library.
2. Store tests for player/queue.
3. Manual device QA for background playback.
4. E2E later with Maestro or Detox.

Critical manual tests:

1. Android background playback after screen lock.
2. iOS playback interruption by phone call/Siri.
3. Bluetooth controls.
4. Local file import permission denial.
5. Auth session persistence after app restart.

## 15. Legal and Store Review Risks

High-risk:

1. YouTube Music stream extraction.
2. Any hidden/unofficial API that bypasses official playback rules.
3. Storing or exposing third-party tokens in mobile bundle.
4. Social login without Apple Sign In where Apple requires it.

Medium-risk:

1. Broad Android media permissions.
2. Background audio declarations without clear user-facing playback feature.
3. SoundCloud/Spotify API scopes without app review.

Low-risk:

1. Jamendo CC streaming.
2. Audius public playback if API terms allow the exact usage.
3. User-imported local files.

Decision for MVP:

1. Ship with local files + Jamendo + Audius + Deezer preview first.
2. Add Spotify metadata/account after auth foundation.
3. Keep YouTube Music disabled behind dev-only flag until legal path is clear.

## 16. Open Questions Sebelum Implementasi

1. Mau Android-first dulu, atau langsung Android + iOS?
2. Auth ingin self-hosted penuh via Better Auth, atau managed via Clerk?
3. Apakah playlist cloud sync wajib untuk MVP pertama?
4. Apakah local music library harus auto-scan semua audio di Android, atau cukup import file/folder manual?
5. Apakah Spotify harus bisa playback di app, atau cukup metadata + open in Spotify untuk fase awal?
6. Apakah app ini akan public store release, atau private/internal dulu?
7. Apakah desktop Harmonix nantinya juga akan memakai backend PostgreSQL ini?

## 17. Recommended First Sprint

Sprint 1 selama 3-5 hari:

1. Scaffold monorepo.
2. Setup `apps/api` dengan Hono.
3. Setup `packages/database` dengan Prisma + PostgreSQL local.
4. Setup Better Auth email/password.
5. Setup `apps/mobile` Expo Router.
6. Buat protected Home screen.
7. Buat `/health` dan `/v1/me`.

Deliverable sprint:

1. User bisa login dari mobile.
2. Mobile bisa memanggil API protected.
3. Database menyimpan user/session.
4. Struktur project siap untuk source/search/player.

## 18. Rujukan Riset

Sumber resmi yang dicek saat membuat blueprint:

1. Expo navigation and Expo Router: https://docs.expo.dev/develop/app-navigation/
2. Expo Router introduction: https://docs.expo.dev/router/introduction/
3. Expo authentication guide: https://docs.expo.dev/develop/authentication/
4. Better Auth Expo integration: https://better-auth.com/docs/integrations/expo
5. Prisma + Better Auth guide: https://docs.prisma.io/docs/guides/authentication/better-auth/nextjs
6. Prisma overview: https://www.prisma.io/docs
7. Prisma PostgreSQL connector: https://docs.prisma.io/docs/v6/orm/overview/databases/postgresql
8. Hono docs: https://www.honojs.com/docs/
9. React Native Track Player intro: https://rntp.dev/docs/intro
10. React Native Track Player background mode: https://rntp.dev/docs/basics/background-mode
11. React Native Track Player installation with Expo note: https://rntp.dev/docs/basics/installation
12. Expo Audio docs: https://docs.expo.dev/versions/latest/sdk/audio/
13. Expo MediaLibrary docs: https://docs.expo.dev/versions/latest/sdk/media-library/
14. Expo SecureStore docs: https://docs.expo.dev/versions/latest/sdk/securestore/
15. NativeWind docs: https://www.nativewind.dev/docs
16. Spotify Android SDK docs: https://developer.spotify.com/documentation/android
17. Spotify iOS SDK docs: https://developer.spotify.com/documentation/ios/getting-started
18. Spotify Web Playback SDK docs: https://developer.spotify.com/documentation/web-playback-sdk
19. Supabase React Native Auth docs, sebagai pembanding: https://supabase.com/docs/guides/auth/quickstarts/react-native
20. Clerk Expo docs, sebagai pembanding: https://docs.expo.dev/guides/using-clerk/
