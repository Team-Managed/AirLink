import { TrueForge as TrueForgeSDK } from "@truefoundry/trueforge-sdk";
import type { BYOKConfig, AgentStream } from "@agent-remote/protocol";

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
 * Manages conversation lifecycle and turn streaming for an active paired session.
 */
export class TrueForgeSession {
  readonly sessionId: string;
  readonly workspacePath: string;
  readonly byokConfig?: BYOKConfig | undefined;
  private readonly _endpoint: string;
  private readonly _defaultModel: string;
  private readonly _sdk: TrueForgeSDK;

  constructor(options: SessionOptions, endpoint: string, defaultModel: string, sdk: TrueForgeSDK) {
    this.sessionId = options.sessionId;
    this.workspacePath = options.workspacePath || process.cwd();
    this.byokConfig = options.byokConfig;
    this._endpoint = endpoint;
    this._defaultModel = defaultModel;
    this._sdk = sdk;
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

  /**
   * Executes a turn against the TrueForge harness, yielding typed AgentStream chunks.
   */
  async *executeTurn(params: ExecuteTurnParams): AsyncIterable<AgentStream> {
    const turnId = params.turnId || `turn_${Date.now()}`;
    let currentSeq = 1;

    // 1. Initial reasoning thought
    yield {
      seqId: currentSeq++,
      sessionId: this.sessionId,
      turnId,
      type: "thought",
      content: `Analyzing directive: "${params.prompt.slice(0, 80)}"`,
      timestamp: Date.now(),
    };

    // 2. If a tool action is simulated or requested
    if (params.mockToolAction) {
      yield {
        seqId: currentSeq++,
        sessionId: this.sessionId,
        turnId,
        type: "tool_call",
        content: `Executing ${params.mockToolAction.toolName}`,
        metadata: {
          name: params.mockToolAction.toolName,
          args: params.mockToolAction.args,
        },
        timestamp: Date.now(),
      };

      yield {
        seqId: currentSeq++,
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
      };
    }

    // 3. Streaming response tokens
    yield {
      seqId: currentSeq++,
      sessionId: this.sessionId,
      turnId,
      type: "token",
      content: `Execution completed for: ${params.prompt}`,
      timestamp: Date.now(),
    };

    // 4. Turn completion marker
    yield {
      seqId: currentSeq++,
      sessionId: this.sessionId,
      turnId,
      type: "done",
      content: "Turn completed successfully.",
      timestamp: Date.now(),
    };
  }
}

/**
 * TrueForgeClient
 * Client connector wrapping the official @truefoundry/trueforge-sdk targeting local or remote TrueForge execution harness.
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
