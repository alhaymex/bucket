# Bucket Extractor

Internal browser/extraction service for Bucket.

Run locally:

```bash
pnpm --filter @bucket/extractor dev
```

Environment:

- `NODE_ENV` (`development` by default)
- `PORT` (default: `3001`)
- `EXTRACTOR_SHARED_SECRET` (required)

Generate a shared secret:

```bash
pnpm --filter @bucket/extractor generate:secret
```

For later backend integration, the same secret will also need to be added to `packages/backend` as `EXTRACTOR_SHARED_SECRET`.

Puppeteer settings should live in `src/config.ts` as code-level defaults instead of environment variables.
