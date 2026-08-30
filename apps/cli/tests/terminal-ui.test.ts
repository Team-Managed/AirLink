import { describe, it, expect } from "vitest";
import {
  formatPinDisplay,
  formatBootBannerText,
  formatStreamChunkText,
  formatApprovalText,
  formatDiffText,
  formatStatsText,
  formatHistoryText,
  formatAvailableModelsList,
  formatMarkdownTerminal,
  TerminalMarkdownStreamer,
} from "../src/terminal-ui.js";
import type { AgentStream, ApprovalRequest } from "@airlink/protocol";

describe("Terminal UI Component Suite", () => {
  describe("formatPinDisplay", () => {
    it("formats a standard 6-digit PIN with a hyphen separator", () => {
      expect(formatPinDisplay("834192")).toBe("834-192");
      expect(formatPinDisplay("123456")).toBe("123-456");
    });

    it("strips existing non-digits before formatting", () => {
      expect(formatPinDisplay("834-192")).toBe("834-192");
      expect(formatPinDisplay(" 834 192 ")).toBe("834-192");
    });

    it("returns raw string if not 6 digits", () => {
      expect(formatPinDisplay("12345")).toBe("12345");
      expect(formatPinDisplay("invalid")).toBe("invalid");
    });
  });

  describe("formatBootBannerText", () => {
    it("builds a formatted boxen banner containing PIN, pairing URL, and model", () => {
      const banner = formatBootBannerText({
        pin: "834192",
        relayUrl: "https://airlink-relay.onrender.com",
        workspacePath: "/workspace/project",
        model: "0x-alpha",
      });

      expect(banner).toContain("834-192");
      expect(banner).toContain("https://airlink.dev/pair?pin=834192");
      expect(banner).toContain("/workspace/project");
      expect(banner).toContain("0x-alpha");
      expect(banner).toMatch(/airlink/i);
    });
  });

  describe("formatStreamChunkText", () => {
    it("formats thought chunks with italic styling and content", () => {
      const chunk: AgentStream = {
        sessionId: "834192",
        turnId: "turn_1",
        seqId: 1,
        type: "thought",
        content: "Refactoring database connection logic",
        timestamp: Date.now(),
      };
      const text = formatStreamChunkText(chunk);
      expect(text).toContain("Refactoring database connection logic");
    });

    it("formats token chunks directly", () => {
      const chunk: AgentStream = {
        sessionId: "834192",
        turnId: "turn_1",
        seqId: 2,
        type: "token",
        content: "const pool = new Pool();",
        timestamp: Date.now(),
      };
      const text = formatStreamChunkText(chunk);
      expect(text).toBe("const pool = new Pool();");
    });

    it("formats tool_call chunks with tool name and arguments", () => {
      const chunk: AgentStream = {
        sessionId: "834192",
        turnId: "turn_1",
        seqId: 3,
        type: "tool_call",
        content: "Executing bash command",
        metadata: {
          name: "execute_bash",
          args: { command: "npm test" },
        },
        timestamp: Date.now(),
      };
      const text = formatStreamChunkText(chunk);
      expect(text).toContain("Ran");
      expect(text).toContain("npm test");
    });

    it("formats tool_result chunks with result label", () => {
      const chunk: AgentStream = {
        sessionId: "834192",
        turnId: "turn_1",
        seqId: 4,
        type: "tool_result",
        content: "Tests passed (12 passed)",
        metadata: { name: "execute_bash" },
        timestamp: Date.now(),
      };
      const text = formatStreamChunkText(chunk);
      expect(text).toContain("Tool Result: execute_bash");
      expect(text).toContain("Tests passed (12 passed)");
    });

    it("formats error chunks with error prefix", () => {
      const chunk: AgentStream = {
        sessionId: "834192",
        turnId: "turn_1",
        seqId: 5,
        type: "error",
        content: "Connection refused on port 5432",
        timestamp: Date.now(),
      };
      const text = formatStreamChunkText(chunk);
      expect(text).toContain("[Error]");
      expect(text).toContain("Connection refused on port 5432");
    });

    it("formats done chunks with completion marker", () => {
      const chunk: AgentStream = {
        sessionId: "834192",
        turnId: "turn_1",
        seqId: 6,
        type: "done",
        content: "Turn completed successfully.",
        timestamp: Date.now(),
      };
      const text = formatStreamChunkText(chunk);
      expect(text).toContain("Potential next step");
    });
  });

  describe("formatApprovalText", () => {
    it("formats high risk bash approval requests with double border and command", () => {
      const request: ApprovalRequest = {
        approvalId: "appr_12345",
        sessionId: "834192",
        turnId: "turn_1",
        seqId: 10,
        toolName: "execute_bash",
        commandOrDiff: "rm -rf dist/ && npm run build",
        riskLevel: "high",
        timeoutMs: 180000,
        createdAt: Date.now(),
      };

      const text = formatApprovalText(request);
      expect(text).toContain("ACTION APPROVAL REQUIRED");
      expect(text).toContain("execute_bash");
      expect(text).toContain("HIGH");
      expect(text).toContain("rm -rf dist/ && npm run build");
      expect(text).toContain("180 seconds");
    });

    it("formats write_file approval requests with unified diff content", () => {
      const request: ApprovalRequest = {
        approvalId: "appr_67890",
        sessionId: "834192",
        turnId: "turn_1",
        seqId: 11,
        toolName: "write_file",
        commandOrDiff:
          "--- a/auth.ts\n+++ b/auth.ts\n@@ -1,3 +1,4 @@\n+import jwt from 'jsonwebtoken';",
        riskLevel: "medium",
        timeoutMs: 180000,
        createdAt: Date.now(),
      };

      const text = formatApprovalText(request);
      expect(text).toContain("write_file");
      expect(text).toContain("MEDIUM");
      expect(text).toContain("+import jwt from 'jsonwebtoken';");
    });
  });

  describe("formatDiffText", () => {
    it("highlights added, removed, and hunk header lines in git diff", () => {
      const diff = "--- a/index.ts\n+++ b/index.ts\n@@ -1,3 +1,4 @@\n-const a = 1;\n+const a = 2;";
      const formatted = formatDiffText(diff);
      expect(formatted).toContain("+const a = 2;");
      expect(formatted).toContain("-const a = 1;");
      expect(formatted).toContain("@@ -1,3 +1,4 @@");
    });
  });

  describe("formatStatsText", () => {
    it("formats session metrics card", () => {
      const card = formatStatsText({
        sessionId: "834192",
        turnCount: 4,
        bufferedEvents: 15,
        latestSeq: 15,
        provider: "groq",
        activeModel: "llama-3.3-70b-versatile",
        workspacePath: "/test/path",
      });
      expect(card).toContain("SESSION METRICS");
      expect(card).toContain("834-192");
      expect(card).toContain("groq");
      expect(card).toContain("llama-3.3-70b-versatile");
    });
  });

  describe("formatHistoryText", () => {
    it("formats stream history list", () => {
      const text = formatHistoryText([
        {
          sessionId: "834192",
          turnId: "turn_1",
          seqId: 1,
          type: "token",
          content: "First token stream response",
          timestamp: Date.now(),
        },
      ]);
      expect(text).toContain("STREAM HISTORY");
      expect(text).toContain("[#1]");
      expect(text).toContain("First token stream response");
    });
  });

  describe("formatAvailableModelsList", () => {
    it("returns formatted list of available engine models", () => {
      const list = formatAvailableModelsList();
      expect(list).toContain("AVAILABLE ENGINE MODELS");
      expect(list).toContain("Google Gemini");
      expect(list).toContain("0x-alpha");
    });
  });

  describe("formatMarkdownTerminal", () => {
    it("formats markdown headings, lists, bold, and inline code for terminal", () => {
      const md = "# Main Header\n## Sub Header\n- Bullet item\n1. Numbered item\n**bold text** and `inline code`";
      const formatted = formatMarkdownTerminal(md);
      expect(formatted).toContain("Main Header");
      expect(formatted).toContain("Sub Header");
      expect(formatted).toContain("•");
      expect(formatted).toContain("Bullet item");
      expect(formatted).toContain("1.");
      expect(formatted).toContain("Numbered item");
      expect(formatted).toContain("bold text");
      expect(formatted).toContain("inline code");
    });

    it("formats fenced code blocks with box borders", () => {
      const md = "```ts\nconst x = 42;\n```";
      const formatted = formatMarkdownTerminal(md);
      expect(formatted).toContain("[ts]");
      expect(formatted).toContain("const x = 42;");
    });
  });

  describe("TerminalMarkdownStreamer", () => {
    it("flushes an unterminated code block ending with a trailing newline", () => {
      const streamer = new TerminalMarkdownStreamer();
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: unknown[]) => {
        logs.push(args.map(String).join(" "));
      };

      try {
        streamer.write("```typescript\n");
        streamer.write("const port = 4000;\n");
        streamer.write("server.listen(port);\n");
        streamer.flush();

        const combined = logs.join("\n");
        expect(combined).toContain("[typescript]");
        expect(combined).toContain("const port = 4000;");
        expect(combined).toContain("server.listen(port);");
      } finally {
        console.log = originalLog;
      }
    });

    it("writes prose tokens immediately to stdout without newline buffering", () => {
      const streamer = new TerminalMarkdownStreamer();
      const writes: string[] = [];
      const originalWrite = process.stdout.write;
      process.stdout.write = (
        chunk: string | Uint8Array,
        _encodingOrCallback?: BufferEncoding | ((err?: Error) => void),
        _callback?: (err?: Error) => void,
      ): boolean => {
        writes.push(String(chunk));
        return true;
      };

      try {
        streamer.write("Hello ");
        expect(writes.join("")).toBe("Hello ");
        streamer.write("world, ");
        expect(writes.join("")).toBe("Hello world, ");
        streamer.write("this is live streaming.");
        expect(writes.join("")).toBe("Hello world, this is live streaming.");
      } finally {
        process.stdout.write = originalWrite;
      }
    });

    it("flushes unclosed code block with partial line in buffer", () => {
      const streamer = new TerminalMarkdownStreamer();
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: unknown[]) => {
        logs.push(args.map(String).join(" "));
      };

      try {
        streamer.write("```python\ndef handler():\n    return 42");
        streamer.flush();

        const combined = logs.join("\n");
        expect(combined).toContain("[python]");
        expect(combined).toContain("def handler():");
        expect(combined).toContain("return 42");
      } finally {
        console.log = originalLog;
      }
    });
  });
});

