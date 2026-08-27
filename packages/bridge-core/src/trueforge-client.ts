import { TrueForge as TrueForgeSDK } from "@truefoundry/trueforge-sdk";
import type { BYOKConfig, AgentStream } from "@agent-remote/protocol";
import { RingBuffer } from "./ring-buffer.js";
import { LLMRunner, type ChatMessageParam, type ProviderConfig } from "./llm-runner.js";
import { PromptBuilder } from "./prompt-builder.js";
import { SkillRegistry } from "./skills/skill-registry.js";
import { ApprovalManager } from "./approval-handler.js";
import { getGitDiff, dispatchWorkspaceTool, WORKSPACE_TOOLS_SCHEMA } from "./workspace-tools.js";

export interface TrueForgeClientOptions {
  endpoint?: string | undefined;
  defaultModel?: string | undefined;
  apiKey?: string | undefined;
}

export interface SessionOptions {
  sessionId: string;
  workspacePath?: string | undefined;
  byokConfig?: BYOKConfig | undefined;
  approvalManager?: ApprovalManager | undefined;
}

export interface MockToolAction {
  toolName: string;
  args: Record<string, unknown>;
  result: string;
}

export interface ExecuteTurnParams {
  prompt: string;
  turnId?: string | undefined;
  byokConfig?: BYOKConfig | undefined;
  mockToolAction?: MockToolAction | undefined;
}

/**
 * TrueForgeSession
 * Manages conversation lifecycle, live multi-provider streaming, turn tracking, and in-memory ring buffering.
 */
export class TrueForgeSession {
  readonly sessionId: string;
  readonly workspacePath: string;
  readonly byokConfig?: BYOKConfig | undefined;
  private readonly _endpoint: string;
  private _defaultModel: string;
  private readonly _sdk: TrueForgeSDK;
  private readonly _ringBuffer: RingBuffer;
  private readonly _llmRunner: LLMRunner;
  private readonly _skillRegistry: SkillRegistry;
  private readonly _promptBuilder: PromptBuilder;
  private readonly _approvalManager: ApprovalManager | null = null;
  private _activeAbortController: AbortController | null = null;
  private _history: ChatMessageParam[] = [];
  private _turnCount: number = 0;

  constructor(options: SessionOptions, endpoint: string, defaultModel: string, sdk: TrueForgeSDK) {
    this.sessionId = options.sessionId;
    this.workspacePath = options.workspacePath || process.cwd();
    this.byokConfig = options.byokConfig;
    this._approvalManager = options.approvalManager ?? null;
    this._endpoint = endpoint;
    this._defaultModel = defaultModel;
    this._sdk = sdk;
    this._ringBuffer = new RingBuffer(500);
    this._skillRegistry = new SkillRegistry({ workspacePath: this.workspacePath });
    this._promptBuilder = new PromptBuilder(this._skillRegistry);
    this._llmRunner = new LLMRunner(
      defaultModel !== "0x-alpha" ? { model: defaultModel } : undefined,
    );
    if (this._llmRunner.config.model && defaultModel === "0x-alpha") {
      this._defaultModel = this._llmRunner.config.model;
    }
  }

  get endpoint(): string {
    return this._endpoint;
  }

  get defaultModel(): string {
    return this._defaultModel;
  }

  get sdk(): TrueForgeSDK {
    return this._sdk;
  }

  get ringBuffer(): RingBuffer {
    return this._ringBuffer;
  }

  get llmRunner(): LLMRunner {
    return this._llmRunner;
  }

  get providerConfig(): ProviderConfig {
    return this._llmRunner.config;
  }

  get turnCount(): number {
    return this._turnCount;
  }

  /**
   * Switches the active LLM engine model.
   */
  public setModel(model: string): void {
    this._defaultModel = model;
    this._llmRunner.setModel(model);
  }

  /**
   * Clears the active conversation context and resets the ring buffer.
   */
  public clearHistory(): void {
    this._history = [];
    this._ringBuffer.clear();
    this._turnCount = 0;
  }

  /**
   * Returns current conversation history.
   */
  public getHistory(): ChatMessageParam[] {
    return [...this._history];
  }

  /**
   * Fetches turn list from TrueForge SDK or falls back to local in-memory records.
   */
  public async listTurns(): Promise<unknown> {
    try {
      return await this._sdk.sessions.listTurns(this.sessionId);
    } catch {
      return this.getHistory();
    }
  }

  /**
   * Fetches a specific turn from the session.
   */
  public async getTurn(turnId: string): Promise<unknown> {
    try {
      return await this._sdk.sessions.getTurn(this.sessionId, turnId);
    } catch {
      return null;
    }
  }

  /**
   * Cancels active session or running turn on the TrueForge harness.
   */
  public async cancelSession(): Promise<{ success: boolean; cancelledLocally: boolean }> {
    this._activeAbortController?.abort();
    try {
      await this._sdk.sessions.cancel(this.sessionId);
    } catch {
      // SDK fallback
    }
    return { success: true, cancelledLocally: true };
  }

  /**
   * Aborts currently executing turn stream locally.
   */
  public abortActiveTurn(): void {
    this._activeAbortController?.abort();
  }

  /**
   * Downloads a sandbox file generated in a session turn.
   */
  public async downloadSandboxFile(turnId: string, filePath: string): Promise<unknown> {
    try {
      return await this._sdk.sessions.downloadSandboxFile(this.sessionId, turnId, {
        path: filePath,
      });
    } catch (err) {
      throw new Error(
        `Failed to download sandbox file "${filePath}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Subscribes to an active turn stream on the TrueForge backend.
   */
  public async subscribeToTurn(turnId: string): Promise<unknown> {
    try {
      return await this._sdk.sessions.subscribeToTurn(this.sessionId, turnId);
    } catch {
      return null;
    }
  }

  /**
   * Lists persisted session events across the active turn branch from TrueForge SDK
   * or falls back to ring buffer events.
   */
  public async listEvents(): Promise<unknown> {
    try {
      return await this._sdk.sessions.listEvents(this.sessionId);
    } catch {
      return this._ringBuffer.getAllEvents();
    }
  }

  /**
   * Creates a turn stream via TrueForge backend if available.
   */
  public async createTurnStream(params?: Record<string, unknown>): Promise<unknown> {
    try {
      return await this._sdk.sessions.createTurnStream(this.sessionId, params || {});
    } catch {
      return null;
    }
  }

  /**
   * Retrieves runtime metrics for the active session.
   */
  public getStats() {
    return {
      sessionId: this.sessionId,
      turnCount: this._turnCount,
      bufferedEvents: this._ringBuffer.size,
      latestSeq: this._ringBuffer.latestSeq,
      provider: this._llmRunner.config.provider,
      activeModel: this._llmRunner.config.model,
      workspacePath: this.workspacePath,
    };
  }

  /**
   * Executes a turn, pushing and yielding typed AgentStream chunks with monotonic sequence IDs.
   */
  async *executeTurn(params: ExecuteTurnParams): AsyncIterable<AgentStream> {
    this._turnCount += 1;
    const turnId = params.turnId || `turn_${Date.now()}`;

    // 1. Initial reasoning thought
    yield this._ringBuffer.push({
      sessionId: this.sessionId,
      turnId,
      type: "thought",
      content: `Analyzing directive: "${params.prompt.slice(0, 80)}"`,
      timestamp: Date.now(),
    });

    // 2. Build 5-Layer Prompt (Layers 1-3 Static Prefix, Layers 4-5 Dynamic Suffix)
    const recentDiff = await getGitDiff(this.workspacePath);
    const promptData = this._promptBuilder.buildPrompt({
      userPrompt: params.prompt,
      workspacePath: this.workspacePath,
      recentDiff,
      history: this._history.map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 200)}`),
    });

    const systemPrompt: ChatMessageParam = {
      role: "system",
      content: promptData.staticPrefix,
    };

    const userMessage: ChatMessageParam = {
      role: "user",
      content: promptData.dynamicSuffix,
    };

    const messagesToSend: ChatMessageParam[] = [systemPrompt, ...this._history, userMessage];

    // 2. Handle mock tool action directly if provided for unit tests
    if (params.mockToolAction) {
      yield this._ringBuffer.push({
        sessionId: this.sessionId,
        turnId,
        type: "thought",
        content: `Executing tool action: ${params.mockToolAction.toolName}`,
        timestamp: Date.now(),
      });

      yield this._ringBuffer.push({
        sessionId: this.sessionId,
        turnId,
        type: "tool_call",
        content: `Executing ${params.mockToolAction.toolName}`,
        metadata: {
          name: params.mockToolAction.toolName,
          args: params.mockToolAction.args,
        },
        timestamp: Date.now(),
      });

      yield this._ringBuffer.push({
        sessionId: this.sessionId,
        turnId,
        type: "tool_result",
        content: params.mockToolAction.result,
        metadata: {
          name: params.mockToolAction.toolName,
          args: params.mockToolAction.args,
          exitCode: 0,
        },
        timestamp: Date.now(),
      });

      yield this._ringBuffer.push({
        sessionId: this.sessionId,
        turnId,
        type: "token",
        content: `Tool executed successfully with result:\n${params.mockToolAction.result}`,
        timestamp: Date.now(),
      });

      yield this._ringBuffer.push({
        sessionId: this.sessionId,
        turnId,
        type: "done",
        content: "Turn completed",
        timestamp: Date.now(),
      });

      return;
    }

    this._activeAbortController = new AbortController();
    const signal = this._activeAbortController.signal;

    let fullAssistantResponse = "";
    let turnsRemaining = 3;

    try {
      while (turnsRemaining > 0) {
        if (signal.aborted) {
          yield this._ringBuffer.push({
            sessionId: this.sessionId,
            turnId,
            type: "thought",
            content: "Turn cancelled by client request.",
            timestamp: Date.now(),
          });
          break;
        }

        turnsRemaining -= 1;
        let turnResponse = "";

        let structuredToolCall: { id: string; name: string; args: Record<string, unknown> } | null =
          null;

        // 3. Stream from live LLM runner with provider-native tools schema
        for await (const chunk of this._llmRunner.streamChat({
          messages: messagesToSend,
          tools: WORKSPACE_TOOLS_SCHEMA,
          byokConfig: params.byokConfig || this.byokConfig,
          signal,
        })) {
          if (chunk.type === "tool_call" && chunk.toolCall) {
            structuredToolCall = chunk.toolCall;
          } else if (chunk.type === "thought") {
            yield this._ringBuffer.push({
              sessionId: this.sessionId,
              turnId,
              type: "thought",
              content: chunk.text,
              timestamp: Date.now(),
            });
          } else {
            turnResponse += chunk.text;
            yield this._ringBuffer.push({
              sessionId: this.sessionId,
              turnId,
              type: "token",
              content: chunk.text,
              timestamp: Date.now(),
            });
          }
        }

        fullAssistantResponse += turnResponse;

        // 5. Check provider-native structured tool call OR fallback regex pattern
        let toolToExecute: { name: string; args: Record<string, unknown> } | null = null;

        if (structuredToolCall && structuredToolCall.name) {
          toolToExecute = {
            name: structuredToolCall.name,
            args: structuredToolCall.args,
          };
        } else {
          // Resilient fallback for models that format tool calls in markdown text
          const toolMatch =
            turnResponse.match(/(?:Tool:\s*|```(?:tool|json)?\s*)(\w+)\s*\(([\s\S]*?)\)/i) ||
            turnResponse.match(/`(\w+)`\s*with\s*(?:parameters?|args?)\s*({[\s\S]*?})/i);

          if (toolMatch && toolMatch[1]) {
            const toolName = toolMatch[1].trim();
            let rawArgs = toolMatch[2]?.trim() || "{}";
            let parsedArgs: Record<string, unknown> = {};

            try {
              parsedArgs = JSON.parse(rawArgs);
            } catch {
              const pathMatch = rawArgs.match(/path['":\s]+([^'"}\s]+)/i);
              if (pathMatch && pathMatch[1]) {
                parsedArgs = { path: pathMatch[1] };
              }
            }

            toolToExecute = { name: toolName, args: parsedArgs };
          }
        }

        if (toolToExecute) {
          const { name: toolName, args: parsedArgs } = toolToExecute;

          // Emit tool_call stream event
          yield this._ringBuffer.push({
            sessionId: this.sessionId,
            turnId,
            type: "tool_call",
            content: `Executing ${toolName}`,
            metadata: {
              name: toolName,
              args: parsedArgs,
            },
            timestamp: Date.now(),
          });

          // Check human-in-the-loop approval policy for destructive operations (execute_bash, write_file)
          const isDestructive = toolName === "execute_bash" || toolName === "write_file";
          if (this._approvalManager && isDestructive) {
            const commandDesc =
              toolName === "execute_bash"
                ? String(parsedArgs["command"] || "")
                : `write_file: ${String(parsedArgs["path"] || "")}`;

            try {
              const approved = await this._approvalManager.requestApproval({
                seqId: this._ringBuffer.latestSeq + 1,
                sessionId: this.sessionId,
                turnId,
                toolName,
                commandOrDiff: commandDesc,
                riskLevel: "high",
                description: `Destructive action: ${toolName}`,
              });

              if (!approved) {
                const denialReason = `Tool "${toolName}" execution denied: Developer rejected approval.`;
                yield this._ringBuffer.push({
                  sessionId: this.sessionId,
                  turnId,
                  type: "tool_result",
                  content: denialReason,
                  metadata: { name: toolName, args: parsedArgs, exitCode: 1 },
                  timestamp: Date.now(),
                });
                messagesToSend.push({
                  role: "assistant",
                  content: `Tool call ${toolName} was rejected.`,
                });
                messagesToSend.push({ role: "user", content: denialReason });
                continue;
              }
            } catch (err) {
              const timeoutReason = `Tool "${toolName}" approval timed out (180s): ${err instanceof Error ? err.message : String(err)}`;
              yield this._ringBuffer.push({
                sessionId: this.sessionId,
                turnId,
                type: "tool_result",
                content: timeoutReason,
                metadata: { name: toolName, args: parsedArgs, exitCode: 1 },
                timestamp: Date.now(),
              });
              break;
            }
          }

          // Execute real workspace tool on PC
          const toolOutput = await dispatchWorkspaceTool(
            toolName,
            parsedArgs,
            this.workspacePath,
            signal,
          );

          // Truncate large tool results to prevent context window overflow
          const previewOutput =
            toolOutput.length > 3000
              ? `${toolOutput.slice(0, 1500)}\n\n[... ${toolOutput.length - 2500} bytes truncated ...]\n\n${toolOutput.slice(-1000)}`
              : toolOutput;

          // Emit tool_result stream event
          yield this._ringBuffer.push({
            sessionId: this.sessionId,
            turnId,
            type: "tool_result",
            content: previewOutput,
            metadata: {
              name: toolName,
              args: parsedArgs,
              exitCode: 0,
            },
            timestamp: Date.now(),
          });

          // Feed tool result back to LLM for final synthesis
          messagesToSend.push({
            role: "assistant",
            content: turnResponse || `Invoked ${toolName}`,
          });
          messagesToSend.push({
            role: "user",
            content: `Tool "${toolName}" executed with output:\n\`\`\`\n${previewOutput}\n\`\`\`\nNow explain the result and answer the user's directive thoroughly.`,
          });
        } else {
          // No further tools needed, turn is complete
          break;
        }
      }

      // 5. Save to session history
      this._history.push(userMessage);
      this._history.push({ role: "assistant", content: fullAssistantResponse });
    } catch (err) {
      yield this._ringBuffer.push({
        sessionId: this.sessionId,
        turnId,
        type: "error",
        content: err instanceof Error ? err.message : "Unknown execution failure",
        timestamp: Date.now(),
      });
    } finally {
      this._activeAbortController = null;
    }

    // 6. Turn completion marker
    yield this._ringBuffer.push({
      sessionId: this.sessionId,
      turnId,
      type: "done",
      content: "Turn completed successfully.",
      timestamp: Date.now(),
    });
  }
}

/**
 * TrueForgeClient
 * Client connector targeting local or remote TrueForge execution harness with full SDK integration.
 */
export class TrueForgeClient {
  readonly endpoint: string;
  readonly defaultModel: string;
  readonly sdk: TrueForgeSDK;

  constructor(options: TrueForgeClientOptions = {}) {
    this.endpoint = options.endpoint || "http://localhost:8000";
    this.defaultModel = options.defaultModel || "0x-alpha";

    // Initialize official TrueForge SDK
    this.sdk = new TrueForgeSDK({
      baseUrl: this.endpoint,
      ...(options.apiKey !== undefined ? { token: options.apiKey } : {}),
    });
  }

  /**
   * Spawns a new session instance.
   */
  createSession(options: SessionOptions): TrueForgeSession {
    return new TrueForgeSession(options, this.endpoint, this.defaultModel, this.sdk);
  }

  /**
   * Lists all configured agents on the TrueForge backend.
   */
  async listAgents(): Promise<unknown> {
    try {
      return await this.sdk.agents.list();
    } catch {
      return [];
    }
  }

  /**
   * Lists registered MCP tool servers.
   */
  async listMcpServers(): Promise<unknown> {
    try {
      return await this.sdk.mcpServers.list();
    } catch {
      return [];
    }
  }

  /**
   * Lists available models on the TrueForge cluster.
   */
  async listModels(): Promise<unknown> {
    try {
      return await this.sdk.models.list();
    } catch {
      return [];
    }
  }

  /**
   * Lists active sessions.
   */
  async listSessions(): Promise<unknown> {
    try {
      return await this.sdk.sessions.list();
    } catch {
      return [];
    }
  }
}
