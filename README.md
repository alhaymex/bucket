# Bucket

## Workspace Commands

- `pnpm lint` runs repo linting across all workspaces
- `pnpm typecheck` runs TypeScript checks across all workspaces
- `pnpm test` runs the workspace test pipeline

Current test coverage:
- `@bucket/backend` runs Vitest integration tests
- `@bucket/extractor` runs Vitest unit and route tests
- `@bucket/common` and `@bucket/mobile` currently have explicit no-op `test` scripts until real test suites are added
