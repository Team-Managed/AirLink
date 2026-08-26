import { TrueForge as TrueForgeSDK } from "@truefoundry/trueforge-sdk";
import type { BYOKConfig, AgentStream } from "@agent-remote/protocol";
import { RingBuffer } from "./ring-buffer.js";
import { LLMRunner, type ChatMessageParam, type ProviderConfig } from "./llm-runner.js";

export interface TrueForgeClientOptions {
  endpoint?: string | undefined;
  defaultModel?: string | undefined;
  apiKey?: string | undefined;
}

export interface SessionOptions {
  sessionId: string;
  workspacePath?: string | undefined;
  byokConfig?: BYOKConfig | undefined;
}

export interface MockToolAction {
  toolName: string;
  args: Record<string, unknown>;
  result: string;
}

export interface ExecuteTurnParams {
  prompt: string;
  turnId?: string | undefined;
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
  private _history: ChatMessageParam[] = [];
  private _turnCount: number = 0;

  constructor(options: SessionOptions, endpoint: string, defaultModel: string, sdk: TrueForgeSDK) {
    this.sessionId = options.sessionId;
    this.workspacePath = options.workspacePath || process.cwd();
    this.byokConfig = options.byokConfig;
    this._endpoint = endpoint;
    this._defaultModel = defaultModel;
    this._sdk = sdk;
    this._ringBuffer = new RingBuffer(500);
    this._llmRunner = new LLMRunner(defaultModel !== "0x-alpha" ? { model: defaultModel } : undefined);
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

    // 2. Prepare message history for LLM
    const systemPrompt: ChatMessageParam = {
      role: "system",
      content: `You are Agent Remote, an expert software engineer and AI coding assistant operating in the repository at "${this.workspacePath}".
Provide direct, comprehensive, and clear technical explanations, architectural overviews, and high-quality code solutions. Answer the user's questions fully and immediately with concrete details and code references.`,
    };

    const userMessage: ChatMessageParam = {
      role: "user",
      content: params.prompt,
    };

    const messagesToSend: ChatMessageParam[] = [
      systemPrompt,
      ...this._history,
      userMessage,
    ];

    let fullAssistantResponse = "";

    try {
      // 3. Stream from live free LLM runner
      for await (const chunk of this._llmRunner.streamChat({ messages: messagesToSend })) {
        if (chunk.type === "thought") {
          yield this._ringBuffer.push({
            sessionId: this.sessionId,
            turnId,
            type: "thought",
            content: chunk.text,
            timestamp: Date.now(),
          });
        } else {
          fullAssistantResponse += chunk.text;
          yield this._ringBuffer.push({
            sessionId: this.sessionId,
            turnId,
            type: "token",
            content: chunk.text,
            timestamp: Date.now(),
          });
        }
      }

      // 4. Save to session history
      this._history.push(userMessage);
      this._history.push({ role: "assistant", content: fullAssistantResponse });

      // 5. Handle mock/simulated tool actions if explicitly supplied
      if (params.mockToolAction) {
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
      }
    } catch (err) {
      yield this._ringBuffer.push({
        sessionId: this.sessionId,
        turnId,
        type: "error",
        content: err instanceof Error ? err.message : "Unknown execution failure",
        timestamp: Date.now(),
      });
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
 * Client connector targeting local or remote TrueForge execution harness.
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
}
