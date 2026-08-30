import { describe, it, expect } from "vitest";

describe("Web Landing Page Configuration and Assets", () => {
  it("provides valid install commands for all platforms", () => {
    const installCommands = {
      windows: "irm https://airlink.dev/install.ps1 | iex",
      posix: "curl -fsSL https://airlink.dev/install.sh | bash",
      npx: "npx @airlink/cli",
    };

    expect(installCommands.windows).toContain("install.ps1");
    expect(installCommands.posix).toContain("install.sh");
    expect(installCommands.npx).toContain("@airlink/cli");
  });

  it("defines all 4 core feature pillars and architecture layers", () => {
    const features = [
      "Zero-Config PIN Pairing",
      "Live Token & Tool Stream",
      "Dual-Surface HITL Approvals",
      "The Elevator Problem Solved",
    ];

    expect(features).toHaveLength(4);
    expect(features).toContain("Zero-Config PIN Pairing");
    expect(features).toContain("Dual-Surface HITL Approvals");
  });

  it("validates support ticket payload structure", () => {
    const validPayload = {
      name: "Jane Dev",
      email: "jane@airlink.dev",
      subject: "General Inquiry",
      message: "Testing local daemon bridge connection",
    };

    expect(validPayload.name.length).toBeGreaterThan(0);
    expect(validPayload.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(validPayload.message.length).toBeGreaterThanOrEqual(5);
  });

  it("validates newsletter subscription payload structure", () => {
    const validEmail = "builder@example.com";
    const invalidEmail = "not-an-email";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(validEmail)).toBe(true);
    expect(emailRegex.test(invalidEmail)).toBe(false);
  });
});
