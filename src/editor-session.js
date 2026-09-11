import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join as posixJoin } from "node:path/posix";
import { join as win32Join } from "node:path/win32";

// The upstream `app-session.js` only reads the macOS "Grok Bot" desktop app's
// encrypted gateway descriptor (Keychain + Electron safeStorage). On Windows
// and Linux, most people running this CLI are already signed into the
// Cursor *editor*, and Cursor's own session token lives in plain view inside
// its per-user SQLite state file (`state.vscdb`, table `ItemTable`, key
// `cursorAuth/accessToken`). This module reads that token as a fallback auth
// source so `gbot` can auto-authenticate outside macOS without any manual
// copy/paste, using CURSOR_ACCESS_TOKEN's existing --experimental EnsureSandBox
// path (see gateway.js).

export function cursorEditorStateDbPath({
  platform = process.platform,
  home = homedir(),
  env = process.env,
} = {}) {
  if (platform === "win32") {
    const appData = env.APPDATA || win32Join(home, "AppData", "Roaming");
    return win32Join(appData, "Cursor", "User", "globalStorage", "state.vscdb");
  }
  if (platform === "linux") {
    const configHome = env.XDG_CONFIG_HOME || posixJoin(home, ".config");
    return posixJoin(configHome, "Cursor", "User", "globalStorage", "state.vscdb");
  }
  if (platform === "darwin") {
    return posixJoin(home, "Library", "Application Support", "Cursor", "User", "globalStorage", "state.vscdb");
  }
  return null;
}

export function hasCursorEditorSession(options = {}) {
  const path = cursorEditorStateDbPath(options);
  return Boolean(path && existsSync(path));
}

// Requires Node's built-in `node:sqlite` (stable Node 23.4+/24+, available
// behind --experimental-sqlite on Node 22.5-22.x). Returns null rather than
// throwing when the module or the row simply isn't there, so callers can
// fall through to other auth sources; throws only when the DB exists but the
// query genuinely fails, so `gbot doctor` can surface a real error.
export async function loadCursorEditorAccessToken(options = {}) {
  const path = cursorEditorStateDbPath(options);
  if (!path || !existsSync(path)) return null;

  let DatabaseSync;
  try {
    ({ DatabaseSync } = await import("node:sqlite"));
  } catch {
    return null;
  }

  const db = new DatabaseSync(path, { readOnly: true });
  try {
    const row = db.prepare("SELECT value FROM ItemTable WHERE key = 'cursorAuth/accessToken'").get();
    const value = row && row.value != null ? String(row.value).trim() : "";
    return value || null;
  } finally {
    db.close();
  }
}

export async function inspectCursorEditorSession(options = {}) {
  if (!hasCursorEditorSession(options)) return { present: false, usable: false };
  try {
    const token = await loadCursorEditorAccessToken(options);
    return token ? { present: true, usable: true } : { present: true, usable: false, error: "No cursorAuth/accessToken row found." };
  } catch (error) {
    return { present: true, usable: false, error: error instanceof Error ? error.message : String(error) };
  }
}
