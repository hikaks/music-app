# Harmonix Mobile Version

This folder contains the planned mobile rewrite of Harmonix.

Current status: Phase 0 scaffold. The mobile app and API are placeholders so the workspace shape, scripts, and shared type package can be validated before database/auth work begins.

## Stack Direction

- Mobile: Expo + React Native + TypeScript + Expo Router
- API: Hono + TypeScript
- Database: PostgreSQL + Prisma, starting in Phase 1
- Auth: Better Auth + Prisma adapter, starting in Phase 1
- Shared types: `packages/shared`

## Commands

```bash
pnpm install
pnpm typecheck
docker compose up -d postgres
pnpm db:migrate
pnpm dev:api
pnpm dev:mobile
```

## Workspace Layout

```text
apps/mobile       Expo mobile app placeholder
apps/api          Hono API placeholder
packages/shared   Shared music/API/source types
packages/database Database package placeholder for Phase 1 Prisma work
packages/config   Shared config package placeholder
```

## Local Backend

Phase 1 uses a local PostgreSQL container on host port `54329`:

```bash
docker compose up -d postgres
pnpm db:migrate
pnpm dev:api
```

The API health endpoint is available at `http://localhost:4000/health`.
