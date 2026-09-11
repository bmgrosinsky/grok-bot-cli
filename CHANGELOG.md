# grok-bot-cli

## 0.3.0 (fork)

### Minor Changes

- Add `src/editor-session.js`: reads the Cursor editor's own session token from its local SQLite state file as a fallback auth source on Windows, Linux, and macOS, alongside the existing macOS-only Grok Bot app session.
- `gateway.js`: `connectGateway()`/`hasGatewayAuth()` try the Cursor editor session before requiring a manually-set `CURSOR_ACCESS_TOKEN`.
- `headers.js`: bump the default `x-cursor-client-version` sent to `EnsureSandBox`, fixing a `401 This version of Grok Bot is no longer supported` error against the current backend. Still overridable via `SAND_CLIENT_VERSION`.
- `cli.js`: `gbot doctor` reports Cursor editor session status; `--help` documents the new auth fallback.
- Add `test/editor-session.test.js` covering path resolution on all three platforms.

## 0.2.2

### Patch Changes

- ce452cd: Support version 2 Grok Bot gateway descriptors and report unusable app sessions clearly in `gbot doctor`.

## 0.2.1

### Patch Changes

- 13f6858: Remove redundant group-member normalization branches.

## 0.2.0

### Minor Changes

- 9691ea3: Add complete bot and group profile creation and update fields, including instructions, titles, avatar shape and color, notifications, and sidebar visibility.
