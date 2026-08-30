import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  getActiveSessionPath,
  type ActiveSessionRecord,
} from "../src/index.js";

describe("Session Persistence Suite", () => {
  const testWorkspace = path.join(os.tmpdir(), "agent-remote-test-session-" + Date.now());

  beforeEach(() => {
    if (!fs.existsSync(testWorkspace)) {
      fs.mkdirSync(testWorkspace, { recursive: true });
    }
  });

  afterEach(() => {
    clearActiveSession(testWorkspace);
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  it("saves and loads active session record for workspace", () => {
    const record: ActiveSessionRecord = {
      pin: "834192",
      sessionId: "834192",
      relayUrl: "http://localhost:3001",
      model: "gemini-2.0-flash",
      workspacePath: testWorkspace,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveActiveSession(record);
    const loaded = loadActiveSession(testWorkspace);

    expect(loaded).not.toBeNull();
    expect(loaded?.pin).toBe("834192");
    expect(loaded?.sessionId).toBe("834192");
    expect(loaded?.model).toBe("gemini-2.0-flash");
  });

  it("clears active session correctly", () => {
    const record: ActiveSessionRecord = {
      pin: "123456",
      sessionId: "123456",
      relayUrl: "http://localhost:3001",
      model: "0x-alpha",
      workspacePath: testWorkspace,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveActiveSession(record);
    expect(loadActiveSession(testWorkspace)).not.toBeNull();

    clearActiveSession(testWorkspace);
    expect(loadActiveSession(testWorkspace)).toBeNull();
  });

  it("returns null for expired sessions", () => {
    const record: ActiveSessionRecord = {
      pin: "999888",
      sessionId: "999888",
      relayUrl: "http://localhost:3001",
      model: "0x-alpha",
      workspacePath: testWorkspace,
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 10000,
    };

    saveActiveSession(record);
    // maxAgeMs = 5000ms -> should expire
    const loaded = loadActiveSession(testWorkspace, 5000);
    expect(loaded).toBeNull();
  });

  it("constructs correct session file path", () => {
    const sessionPath = getActiveSessionPath(testWorkspace);
    expect(sessionPath).toBe(path.join(testWorkspace, ".agent-remote", "session.json"));
  });
});
