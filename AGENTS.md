# Project Guidance

This repository is focused on Harmonix Mobile and InsForge.

## Scope

- Build the Expo React Native mobile app in `apps/mobile`.
- Keep shared music contracts in `packages/shared`.
- Use InsForge for backend auth, database, storage, functions, realtime, and AI gateway work.
- Use `docs/insforge-backend-database.md` as the backend database reference.

## InsForge Project

| Field | Value |
|---|---|
| Project | My First Project |
| Project ID | `b8bcb919-7b63-4a1f-9753-1837df036923` |
| Backend URL | `https://5izff6gg.ap-southeast.insforge.app` |
| Region | `ap-southeast` |

## Required Workflow

- Before writing InsForge integration code, fetch current InsForge docs with MCP.
- For mobile app code, use `@insforge/sdk`.
- For backend infrastructure, use InsForge MCP tools or `npx @insforge/cli`.
- Use InsForge for backend work in this repo.
- Do not add server-only secrets to Expo public env.

## Mobile Env

Use public Expo variables only:

```bash
EXPO_PUBLIC_INSFORGE_URL=https://5izff6gg.ap-southeast.insforge.app
EXPO_PUBLIC_INSFORGE_ANON_KEY=replace-with-insforge-anon-key
EXPO_PUBLIC_APP_SCHEME=harmonix
```

Never commit real keys. `.insforge` and local env files must stay ignored.

## Backend Safety

- The current InsForge backend still contains non-Harmonix tables.
- Do not run destructive database changes without explicit confirmation.
- Add RLS before mobile reads or writes user-scoped tables directly.
- Use InsForge Functions for any operation that needs server-only credentials.
