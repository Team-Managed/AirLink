import { describe, it, expect } from "vitest";
import { parseCliArgs } from "../src/index.js";

describe("CLI Argument Parser Suite", () => {
  it("parses default options and auto-generates a valid 6-digit numeric PIN", () => {
    const options = parseCliArgs([]);

    expect(options.relayUrl).toBe(process.env["RELAY_URL"] || "http://localhost:3001");
    expect(options.pin).toMatch(/^\d{6}$/);
    expect(options.workspacePath).toBe(process.cwd());
    expect(typeof options.model).toBe("string");
    expect(options.model.length).toBeGreaterThan(0);
    expect(options.daemon).toBe(false);
    expect(options.issueNumber).toBeUndefined();
    expect(options.autoPr).toBeUndefined();
  });

  it("parses explicit flags for relay, pin, dir, model, issue, and daemon", () => {
    const args = [
      "--relay",
      "https://relay.custom.dev",
      "--pin",
      "555888",
      "--dir",
      "/custom/workspace",
      "--model",
      "deepseek-r1",
      "--issue",
      "42",
      "--pr",
      "--daemon",
    ];

    const options = parseCliArgs(args);

    expect(options.relayUrl).toBe("https://relay.custom.dev");
    expect(options.pin).toBe("555888");
    expect(options.workspacePath).toBe("/custom/workspace");
    expect(options.model).toBe("deepseek-r1");
    expect(options.issueNumber).toBe(42);
    expect(options.autoPr).toBe(true);
    expect(options.daemon).toBe(true);
  });

  it("normalizes invalid PIN input to a fresh 6-digit PIN", () => {
    const options = parseCliArgs(["--pin", "invalid"]);
    expect(options.pin).toMatch(/^\d{6}$/);
  });
});
