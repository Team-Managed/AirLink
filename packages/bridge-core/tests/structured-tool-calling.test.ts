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
    expect(fileResult).toMatch(/@airlink|airlink-monorepo|@agent-remote/);
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

  it("LLMRunner parses Anthropic SSE tool_use and input_json_delta stream events", async () => {
    const sseChunks = [
      'data: {"type":"message_start","message":{"id":"msg_123"}}\n\n',
      'data: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_01","name":"write_file","input":{}}}\n\n',
      'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{\\"path\\": \\"index.ts\\""}}\n\n',
      'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":", \\"content\\": \\"console.log(1)\\"}"}}\n\n',
      'data: {"type":"content_block_stop","index":0}\n\n',
      'data: {"type":"message_stop"}\n\n',
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of sseChunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    const runner = new LLMRunner({
      provider: "anthropic",
      model: "claude-3-5-sonnet",
      apiKey: "sk-ant-test",
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });

    try {
      const events: Array<{ type: string; toolCall?: { id?: string; name?: string; args?: Record<string, unknown> } }> = [];
      for await (const chunk of runner.streamChat({
        messages: [{ role: "user", content: "Write index.ts" }],
        tools: WORKSPACE_TOOLS_SCHEMA,
      })) {
        events.push(chunk as typeof events[number]);
      }

      const toolCall = events.find((e) => e.type === "tool_call");
      expect(toolCall).toBeDefined();
      expect(toolCall?.toolCall?.name).toBe("write_file");
      expect(toolCall?.toolCall?.args).toEqual({ path: "index.ts", content: "console.log(1)" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
