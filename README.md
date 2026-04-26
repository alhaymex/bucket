# Bucket

## Workspace Commands

- `pnpm lint` runs repo linting across all workspaces
- `pnpm typecheck` runs TypeScript checks across all workspaces
- `pnpm test` runs the workspace test pipeline

Current test coverage:

- `@bucket/backend` runs Vitest integration tests
- `@bucket/extractor` runs Vitest unit and route tests
- `@bucket/common` and `@bucket/mobile` currently have explicit no-op `test` scripts until real test suites are added

## Roadmap

- Improve rich embeds for social links, especially Facebook and Reddit posts.
- Add a fallback preview card when a platform cannot provide a clean embed.
- Expand embed metadata extraction so saved links can show better titles, authors, thumbnails, and source context.
