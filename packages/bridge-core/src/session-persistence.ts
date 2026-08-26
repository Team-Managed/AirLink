import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface ActiveSessionRecord {
  pin: string;
  sessionId: string;
  relayUrl: string;
  model: string;
  workspacePath: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Returns the path to the session persistence file.
 */
export function getActiveSessionPath(workspacePath?: string): string {
  if (workspacePath && workspacePath.trim().length > 0) {
    return path.join(workspacePath, ".agent-remote", "session.json");
  }
  return path.join(os.homedir(), ".agent-remote", "session.json");
}

/**
 * Persists active session metadata to disk for cross-tool synchronization
 * (CLI <-> VS Code Extension <-> Web/Mobile).
 */
export function saveActiveSession(record: ActiveSessionRecord): void {
  try {
    const sessionFile = getActiveSessionPath(record.workspacePath);
    const dir = path.dirname(sessionFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(sessionFile, JSON.stringify(record, null, 2), "utf-8");
  } catch {
    // Graceful fallback if filesystem is restricted
  }
}

/**
 * Loads the active session for the workspace or user home directory.
 * If expired (older than maxAgeMs), returns null.
 */
export function loadActiveSession(
  workspacePath?: string,
  maxAgeMs: number = 24 * 60 * 60 * 1000,
): ActiveSessionRecord | null {
  try {
    const candidates: string[] = [];
    if (workspacePath && workspacePath.trim().length > 0) {
      candidates.push(path.join(workspacePath, ".agent-remote", "session.json"));
    }
    candidates.push(path.join(os.homedir(), ".agent-remote", "session.json"));

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        const parsed = JSON.parse(raw) as ActiveSessionRecord;
        if (parsed.pin && parsed.sessionId) {
          const age = Date.now() - (parsed.updatedAt || parsed.createdAt || 0);
          if (age >= 0 && age < maxAgeMs) {
            return parsed;
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clears the active session file on explicit reset or logout.
 */
export function clearActiveSession(workspacePath?: string): void {
  try {
    const sessionFile = getActiveSessionPath(workspacePath);
    if (fs.existsSync(sessionFile)) {
      fs.unlinkSync(sessionFile);
    }
  } catch {
    // Ignore error
  }
}
