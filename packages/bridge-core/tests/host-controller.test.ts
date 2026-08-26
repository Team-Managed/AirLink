import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  AgentHostController,
  formatPin,
  generatePin,
  loadActiveSession,
  clearActiveSession,
} from "../src/index.js";

describe("AgentHostController Suite", () => {
  const testWorkspace = path.join(os.tmpdir(), "agent-remote-host-ctrl-test-" + Date.now());

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

  it("formats PIN with hyphen separator", () => {
    expect(formatPin("123456")).toBe("123-456");
    expect(formatPin("987654")).toBe("987-654");
    expect(formatPin("123-456")).toBe("123-456");
  });

  it("generates 6-digit numeric PIN", () => {
    const pin = generatePin();
    expect(pin).toMatch(/^\d{6}$/);
    expect(Number(pin)).toBeGreaterThanOrEqual(100000);
    expect(Number(pin)).toBeLessThanOrEqual(999999);
  });

  it("initializes with explicit or auto-generated PIN and saves session", () => {
    const controller = new AgentHostController({
      pin: "456789",
      workspacePath: testWorkspace,
      autoConnect: false,
    });

    expect(controller.pin).toBe("456789");
    expect(controller.formattedPin).toBe("456-789");
    expect(controller.workspacePath).toBe(testWorkspace);

    const info = controller.start();
    expect(info.pin).toBe("456789");
    expect(info.formattedPin).toBe("456-789");

    // Verify session persistence
    const saved = loadActiveSession(testWorkspace);
    expect(saved).not.toBeNull();
    expect(saved?.pin).toBe("456789");

    controller.stop();
  });

  it("reuses existing active session PIN from workspace if not specified", () => {
    // 1. First controller creates session with PIN 888999
    const controller1 = new AgentHostController({
      pin: "888999",
      workspacePath: testWorkspace,
      autoConnect: false,
    });
    controller1.start();
    controller1.stop();

    // 2. Second controller (e.g. VS Code extension starting after CLI)
    const controller2 = new AgentHostController({
      workspacePath: testWorkspace,
      autoConnect: false,
    });

    expect(controller2.pin).toBe("888999");
    expect(controller2.formattedPin).toBe("888-999");
  });

  it("dispatches turns and emits stream chunks to registered listeners", async () => {
    const controller = new AgentHostController({
      pin: "112233",
      workspacePath: testWorkspace,
      autoConnect: false,
    });

    const receivedChunks: string[] = [];
    const unsubscribe = controller.onStreamChunk((chunk) => {
      if (chunk.type === "token") {
        receivedChunks.push(chunk.content);
      }
    });

    controller.start();
    await controller.dispatchTurn("Hello agent, list the directory please.", "local");

    expect(receivedChunks.length).toBeGreaterThan(0);
    const joined = receivedChunks.join("");
    expect(joined.length).toBeGreaterThan(0);

    unsubscribe();
    controller.stop();
  });

  it("handles model switching and session clearing", () => {
    const controller = new AgentHostController({
      pin: "334455",
      workspacePath: testWorkspace,
      autoConnect: false,
    });

    controller.start();
    controller.setModel("llama-3.3-70b-versatile");

    const info = controller.getSessionInfo();
    expect(info.model).toBe("llama-3.3-70b-versatile");

    controller.clearSession();
    expect(loadActiveSession(testWorkspace)).toBeNull();

    controller.stop();
  });

  it("tracks execution state and prevents concurrent turn execution collision", async () => {
    const controller = new AgentHostController({
      pin: "556677",
      workspacePath: testWorkspace,
      autoConnect: false,
    });

    controller.start();
    const systemMessages: string[] = [];
    controller.onSystemMessage((msg) => systemMessages.push(msg));

    const turn1 = controller.dispatchTurn("Prompt 1", "local");
    const turn2 = controller.dispatchTurn("Prompt 2 concurrent", "local");

    await Promise.all([turn1, turn2]);

    expect(systemMessages.some((m) => m.includes("already running"))).toBe(true);

    controller.stop();
  });
});
