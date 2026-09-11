# grok-bot-cli (cross-platform auth fork)

[![npm version](https://img.shields.io/npm/v/grok-bot-cli.svg)](https://www.npmjs.com/package/grok-bot-cli)

Manage [Grok Bot](https://cursor.com/help/grok-bot/plans) agents, groups, and messages from your terminal.

![Live create, group, send, and delete smoke test](https://raw.githubusercontent.com/ScriptedAlchemy/grok-bot-cli/main/demo/grok-bot-cli-demo.gif)

[Watch the MP4](https://github.com/ScriptedAlchemy/grok-bot-cli/blob/main/demo/grok-bot-cli-demo.mp4)

This is a fork of [ScriptedAlchemy/grok-bot-cli](https://github.com/ScriptedAlchemy/grok-bot-cli), whose auto-login only works on macOS. This fork adds an auth fallback that works on Windows and Linux too, and fixes a version-gate error that had started rejecting the CLI's requests. See [What this fork changes](#what-this-fork-changes) below for the details.

## Install

Zero runtime dependencies, so this installs from source without needing npm registry access:

```sh
git clone https://github.com/bmgrosinsky/grok-bot-cli.git
cd grok-bot-cli
npm install -g .
```

Requires Node.js 18+. (The Windows/Linux auth fallback described below additionally needs Node 22.5+ for `node:sqlite`; everything else works on 18+.)

## Auth

The original CLI expects the macOS **Grok Bot** desktop app to be installed and signed in; it reads that app's encrypted session from the macOS Keychain. That path only exists on macOS.

This fork adds a second automatic path: if you're signed into the **Cursor editor** (not the Grok Bot app) on Windows, Linux, or macOS, `gbot` will reuse that session automatically. No token copying required, in most cases.

Auth is resolved in this order:

1. `GROK_BOT_GATEWAY_URL` + `GROK_BOT_GATEWAY_TOKEN` (explicit gateway override)
2. The Grok Bot app's own session (macOS only)
3. The Cursor editor's session (Windows/Linux/macOS, requires Node 22.5+)
4. `CURSOR_ACCESS_TOKEN` (manual token)

Run `gbot doctor` any time to see which of these is active:

```
gbot doctor
```

### If none of the automatic paths work

Set `CURSOR_ACCESS_TOKEN` yourself. It's a Cursor **session** token, not a dashboard API key (dashboard keys are explicitly rejected by the backend). If you're on Windows or Linux and the automatic Cursor-editor detection fails (older Node, or Cursor storing the token somewhere unexpected), you can extract it yourself the same way this fork's fallback does, straight from Cursor's local session database:

**Windows (PowerShell):**

```powershell
@'
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync(process.env.APPDATA + "\\Cursor\\User\\globalStorage\\state.vscdb", { readOnly: true });
const row = db.prepare("SELECT value FROM ItemTable WHERE key='cursorAuth/accessToken'").get();
console.log(row.value);
'@ | Set-Content -Path "$env:TEMP\get-token.js" -Encoding utf8

$token = node --experimental-sqlite "$env:TEMP\get-token.js"
setx CURSOR_ACCESS_TOKEN $token
```

Close and reopen your terminal after `setx`, then run `gbot doctor` to confirm.

**macOS/Linux (bash/zsh):** same idea, pointed at Cursor's Linux config path (`~/.config/Cursor/User/globalStorage/state.vscdb`) or macOS path (`~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`):

```sh
export CURSOR_ACCESS_TOKEN=$(node --experimental-sqlite -e '
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(process.env.HOME + "/.config/Cursor/User/globalStorage/state.vscdb", { readOnly: true });
  console.log(db.prepare("SELECT value FROM ItemTable WHERE key=?").get("cursorAuth/accessToken").value);
')
```

This token expires when your Cursor session refreshes, so you may need to redo this periodically if auth goes stale.

### "This version of Grok Bot is no longer supported"

If `gbot` fails with `EnsureSandBox failed: 401 This version of Grok Bot is no longer supported`, the backend's minimum accepted client version has moved past what's currently set. Override it:

```sh
export SAND_CLIENT_VERSION="0.39.0"   # bump as needed; check your Grok Bot app's version if this drifts again
```

## Use

```sh
gbot doctor
gbot bots list
gbot bots create --name Researcher
gbot bots update Researcher --description "Research the launch" --notify on
gbot bots create --name Writer
gbot groups create --name Launch --member Researcher --member Writer --description "Ship together"
gbot groups update Launch --title "Launch room" --hidden off
gbot send Researcher "Summarize the launch status."
gbot send Launch "Share your updates."
gbot thread Researcher
gbot groups delete Launch
gbot bots delete Researcher
gbot bots delete Writer
```

`update` fields: `--name` `--description`/`--instructions` `--title` `--avatar-shape` `--avatar-color` `--notify` `--hidden`. `--description` is the UI Instructions field.

Add `--json` to any command for machine-readable output.

Run `gbot --help` for every command.

## What this fork changes

Everything below is additive; nothing from upstream was removed or renamed, so this stays a drop-in fork.

- **`src/editor-session.js` (new):** reads the Cursor editor's session token directly from its local SQLite state file (`state.vscdb`, table `ItemTable`, key `cursorAuth/accessToken`) on Windows, Linux, and macOS, using Node's built-in `node:sqlite`. This is a different app and a different storage mechanism than upstream's macOS-only Grok Bot app session (`src/app-session.js`, which stays untouched).
- **`src/gateway.js`:** `connectGateway()` and `hasGatewayAuth()` now fall back to the Cursor editor session (above) after checking for an explicit gateway override, the macOS app session, and `CURSOR_ACCESS_TOKEN`, before finally giving up. Order of precedence is unchanged for anyone already relying on the original behavior.
- **`src/headers.js`:** bumped the default `x-cursor-client-version` sent with `EnsureSandBox` requests, since the backend started rejecting the old hardcoded value with a "no longer supported" error. Still overridable via `SAND_CLIENT_VERSION`, same as upstream.
- **`src/cli.js`:** `gbot doctor` now also reports the Cursor editor session's status, and the `--help` auth line mentions the new fallback.
- **`test/editor-session.test.js` (new):** unit tests for the new module's path resolution across all three platforms.

None of this touches the actual Grok Bot gateway API surface (`bots`/`groups`/`send`/`thread`), which is unchanged from upstream.

## License

MIT, inherited from the upstream project (see `LICENSE`). This fork's changes are contributed under the same license.
