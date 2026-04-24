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
- `PUPPETEER_TIMEOUT_MS` (default: `30000`)
- `PUPPETEER_MAX_CONCURRENCY` (default: `2`)
- `CHROME_PATH` (optional)

Generate a shared secret:

```bash
pnpm --filter @bucket/extractor generate:secret
```

For later backend integration, the same secret will also need to be added to `packages/backend` as `EXTRACTOR_SHARED_SECRET`.
