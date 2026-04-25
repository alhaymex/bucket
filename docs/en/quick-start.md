---
title: "Quick Start"
description: "Get oriented in the Bucket codebase and run the main developer workflows"
---

## Get started in three steps

Use this page to get productive in the Bucket repo quickly. It covers what the codebase contains, what you need locally, and the main commands and workflows to know first.

### Step 1: Understand the repo shape

Bucket is a mobile-first app for saving and organizing links.

The main codebase areas are:

- `apps/mobile`: Expo app, screens, navigation, providers, and mobile build config
- `packages/backend`: Convex schema, auth, queries, mutations, actions, and link-processing logic
- `apps/extractor`: Fastify + Puppeteer extraction service used as a browser fallback
- `packages/common`: shared schemas, contracts, and small utilities

The main service boundaries are:

- Mobile sends user actions and reads stored data.
- Backend stores links, classifies them, and orchestrates follow-up work.
- Extractor runs separately behind an HTTP boundary with a shared secret.
- Common keeps shared types and request/response contracts aligned.

### Step 2: Set up and run the repo locally

Prerequisites:

- Node.js `>=18`
- `pnpm` `9.x`

Node `20` is the safest local choice because CI runs on it.

Install dependencies:

```bash
pnpm install
```

Local env file locations currently used in the repo:

- `apps/mobile/.env.local`
- `packages/backend/.env.local`
- `apps/extractor/.env` or `apps/extractor/.env.local`

Key variables to know:

- Mobile: `EXPO_PUBLIC_CONVEX_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Backend: `CLERK_WEBHOOK_SIGNING_SECRET`, `EXTRACTOR_BASE_URL`, `EXTRACTOR_SHARED_SECRET`
- Extractor: `EXTRACTOR_SHARED_SECRET`, optional `CHROME_PATH`, optional `PORT` with default `3001`

External services involved:

- Convex for backend runtime and data
- Clerk for auth and user sync
- Expo / EAS for mobile development and builds

The backend and extractor must use the same `EXTRACTOR_SHARED_SECRET`.

Start the main local workflows:

```bash
pnpm --filter @bucket/backend dev
pnpm --filter @bucket/extractor dev
pnpm --filter @bucket/mobile dev
```

### Step 3: Learn the main commands and flow

Workspace commands:

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
```

Useful package commands:

```bash
pnpm --filter @bucket/mobile start:ios
pnpm --filter @bucket/mobile start:android
pnpm --filter @bucket/backend logs
pnpm --filter @bucket/extractor generate:secret
```

The main runtime flow is:

1. Mobile submits a saved link to the backend.
2. Backend stores the link, normalizes it, and classifies it.
3. Backend fetches metadata and readable content.
4. Backend calls the extractor when direct extraction is blocked or not usable enough.
5. Backend stores final reader content in Convex.
6. Mobile reads and renders the stored content.

If you need to trace saved-link behavior, start in `packages/backend/convex/links/*` and then check `apps/extractor/src/*`.

## CI and mobile build behavior

Current essentials:

- CI config: `.github/workflows/ci.yml`
- Mobile build config: `.github/workflows/mobile-build.yml`
- EAS profiles: `apps/mobile/eas.json`

Branch behavior today:

- `preview` triggers CI first, then the preview mobile build on CI success
- `main` triggers CI first, then the production mobile build on CI success
- manual mobile builds are also available with `workflow_dispatch`

## Current constraints

- Mobile tests are still placeholders.
- Embed handling is still evolving.
- Extractor is a separate service.
- Dockerization is planned, not the default developer workflow.
