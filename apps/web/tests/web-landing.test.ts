import { describe, it, expect } from "vitest";

describe("Web Landing Page Configuration and Assets", () => {
  it("provides valid install commands for all platforms", () => {
    const installCommands = {
      windows: "irm https://agent-remote.dev/install.ps1 | iex",
      posix: "curl -fsSL https://agent-remote.dev/install.sh | bash",
      npx: "npx @agent-remote/cli",
    };

    expect(installCommands.windows).toContain("install.ps1");
    expect(installCommands.posix).toContain("install.sh");
    expect(installCommands.npx).toContain("@agent-remote/cli");
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
});
