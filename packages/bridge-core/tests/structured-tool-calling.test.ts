import { describe, it, expect } from "vitest";
import {
  LLMRunner,
  TrueForgeClient,
  WORKSPACE_TOOLS_SCHEMA,
  dispatchWorkspaceTool,
} from "../src/index.js";

describe("Structured Tool Calling Suite", () => {
  it("exports valid OpenAI-compatible tools schema definition", () => {
    expect(Array.isArray(WORKSPACE_TOOLS_SCHEMA)).toBe(true);
    expect(WORKSPACE_TOOLS_SCHEMA.length).toBeGreaterThanOrEqual(5);

    const toolNames = WORKSPACE_TOOLS_SCHEMA.map(
      (t) => (t as { function: { name: string } }).function.name,
    );
    expect(toolNames).toContain("list_directory");
    expect(toolNames).toContain("read_file");
    expect(toolNames).toContain("get_git_diff");
    expect(toolNames).toContain("run_tests");
    expect(toolNames).toContain("execute_bash");
  });

  it("dispatches workspace tools correctly with typed parameters", async () => {
    const listResult = await dispatchWorkspaceTool("list_directory", { path: "." }, process.cwd());
    expect(listResult).toContain("package.json");

    const fileResult = await dispatchWorkspaceTool(
      "read_file",
      { path: "package.json" },
      process.cwd(),
    );
    expect(fileResult).toMatch(/@agent-remote|agent-remote-monorepo/);
  });

  it("handles structured mock tool actions and emits tool_call and tool_result events", async () => {
    const client = new TrueForgeClient();
    const session = client.createSession({ sessionId: "test-tool-call" });

    const chunks = [];
    for await (const chunk of session.executeTurn({
      prompt: "Check files",
      mockToolAction: {
        toolName: "list_directory",
        args: { path: "." },
        result: "package.json\npnpm-workspace.yaml",
      },
    })) {
      chunks.push(chunk);
    }

    const toolCallEvent = chunks.find((c) => c.type === "tool_call");
    const toolResultEvent = chunks.find((c) => c.type === "tool_result");

    expect(toolCallEvent).toBeDefined();
    expect(toolCallEvent?.metadata?.name).toBe("list_directory");
    expect(toolResultEvent).toBeDefined();
    expect(toolResultEvent?.content).toContain("pnpm-workspace.yaml");
  });

  it("LLMRunner accepts tools schema and toolChoice options", () => {
    const runner = new LLMRunner({ provider: "simulated" });
    expect(runner).toBeDefined();

    // Verify streamChat method signature accepts tools schema without errors
    const stream = runner.streamChat({
      messages: [{ role: "user", content: "hello" }],
      tools: WORKSPACE_TOOLS_SCHEMA,
      toolChoice: "auto",
    });

    expect(stream).toBeDefined();
  });
});
