import { test } from "node:test";
import assert from "node:assert/strict";
import { cursorEditorStateDbPath, hasCursorEditorSession } from "../src/editor-session.js";

test("resolves the Windows Cursor state db path", () => {
  const path = cursorEditorStateDbPath({
    platform: "win32",
    home: "C:\\Users\\demo",
    env: { APPDATA: "C:\\Users\\demo\\AppData\\Roaming" },
  });
  assert.equal(
    path,
    "C:\\Users\\demo\\AppData\\Roaming\\Cursor\\User\\globalStorage\\state.vscdb",
  );
});

test("resolves the Linux Cursor state db path", () => {
  const path = cursorEditorStateDbPath({ platform: "linux", home: "/home/demo", env: {} });
  assert.equal(path, "/home/demo/.config/Cursor/User/globalStorage/state.vscdb");
});

test("resolves the macOS Cursor state db path", () => {
  const path = cursorEditorStateDbPath({ platform: "darwin", home: "/Users/demo", env: {} });
  assert.equal(
    path,
    "/Users/demo/Library/Application Support/Cursor/User/globalStorage/state.vscdb",
  );
});

test("hasCursorEditorSession is false when the db file is absent", () => {
  assert.equal(
    hasCursorEditorSession({ platform: "linux", home: "/nonexistent-demo-home", env: {} }),
    false,
  );
});
