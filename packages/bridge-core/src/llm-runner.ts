import type { BYOKConfig } from "@agent-remote/protocol";

export type FreeProvider =
  | "groq"
  | "gemini"
  | "openrouter_free"
  | "github_models"
  | "ollama"
  | "openai"
  | "anthropic"
  | "simulated";

export interface ProviderConfig {
  provider: FreeProvider;
  model: string;
  apiKey?: string | undefined;
  baseUrl?: string | undefined;
  isFree: boolean;
}

export interface StructuredToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ChatMessageParam {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string | undefined;
  name?: string | undefined;
}

export interface LLMStreamParams {
  messages: ChatMessageParam[];
  model?: string | undefined;
  provider?: FreeProvider | undefined;
  apiKey?: string | undefined;
  baseUrl?: string | undefined;
  byokConfig?: BYOKConfig | undefined;
  tools?: unknown[] | undefined;
  toolChoice?:
    "auto" | "none" | "required" | { type: "function"; function: { name: string } } | undefined;
  signal?: AbortSignal | undefined;
}

export interface StreamEventChunk {
  type: "thought" | "token" | "tool_call";
  text: string;
  toolCall?: StructuredToolCall | undefined;
}

/**
 * Free Models Registry
 */
export const FREE_MODELS = {
  groq: [
    "llama-3.3-70b-versatile",
    "deepseek-r1-distill-llama-70b",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
  ],
  gemini: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite"],
  openrouter_free: [
    "deepseek/deepseek-r1:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen-2.5-coder-32b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
  ],
  github_models: ["gpt-4o", "gpt-4o-mini", "Meta-Llama-3.3-70B-Instruct", "DeepSeek-R1"],
  ollama: ["deepseek-r1", "llama3.3", "qwen2.5-coder"],
} as const;

export function getProviderDefaultBaseUrl(provider: FreeProvider): string {
  switch (provider) {
    case "groq":
      return "https://api.groq.com/openai/v1";
    case "gemini":
      return "https://generativelanguage.googleapis.com/v1beta/openai";
    case "openrouter_free":
      return "https://openrouter.ai/api/v1";
    case "github_models":
      return "https://models.inference.ai.azure.com";
    case "ollama":
      return process.env["OLLAMA_BASE_URL"] || "http://localhost:11434/v1";
    case "openai":
      return "https://api.openai.com/v1";
    default:
      return "https://api.groq.com/openai/v1";
  }
}

/**
 * Detects the matching provider family for a specified model identifier.
 */
export function detectProviderForModel(modelName: string): FreeProvider {
  if (FREE_MODELS.groq.includes(modelName as never)) return "groq";
  if (FREE_MODELS.gemini.includes(modelName as never)) return "gemini";
  if (FREE_MODELS.openrouter_free.includes(modelName as never)) return "openrouter_free";
  if (FREE_MODELS.github_models.includes(modelName as never)) return "github_models";
  if (FREE_MODELS.ollama.includes(modelName as never)) return "ollama";

  if (modelName.startsWith("gemini-")) return "gemini";
  if (
    modelName.startsWith("llama-") ||
    modelName.startsWith("mixtral-") ||
    modelName.startsWith("gemma-") ||
    modelName.startsWith("qwen-")
  ) {
    return "groq";
  }
  if (modelName.startsWith("gpt-")) return "github_models";
  if (modelName.includes(":free") || modelName.startsWith("openrouter/")) return "openrouter_free";
  if (modelName.startsWith("ollama/") || modelName.startsWith("deepseek-")) return "ollama";

  return "simulated";
}

/**
 * Resolves the active API key strictly associated with a specific provider.
 * Never retains or leaks previous provider credentials across model switches.
 */
export function getProviderApiKey(provider: FreeProvider): string | undefined {
  switch (provider) {
    case "groq":
      return process.env["GROQ_API_KEY"];
    case "gemini":
      return process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"];
    case "openrouter_free":
      return process.env["OPENROUTER_API_KEY"] || process.env["OPENROUTER_FREE_KEY"];
    case "github_models":
      return process.env["GITHUB_TOKEN"] || process.env["GH_TOKEN"];
    case "openai":
      return process.env["OPENAI_API_KEY"];
    case "anthropic":
      return process.env["ANTHROPIC_API_KEY"];
    case "ollama":
    case "simulated":
      return undefined;
    default:
      return undefined;
  }
}

/**
 * Detects the active free LLM provider based on available environment variables.
 */
export function detectFreeProvider(): ProviderConfig {
  if (process.env["GROQ_API_KEY"]) {
    return {
      provider: "groq",
      model: process.env["AGENT_MODEL"] || "llama-3.3-70b-versatile",
      apiKey: process.env["GROQ_API_KEY"],
      baseUrl: "https://api.groq.com/openai/v1",
      isFree: true,
    };
  }

  if (process.env["GEMINI_API_KEY"]) {
    return {
      provider: "gemini",
      model: process.env["AGENT_MODEL"] || "gemini-2.0-flash",
      apiKey: process.env["GEMINI_API_KEY"],
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      isFree: true,
    };
  }

  if (process.env["OPENROUTER_API_KEY"]) {
    return {
      provider: "openrouter_free",
      model: process.env["AGENT_MODEL"] || "deepseek/deepseek-r1:free",
      apiKey: process.env["OPENROUTER_API_KEY"],
      baseUrl: "https://openrouter.ai/api/v1",
      isFree: true,
    };
  }

  if (process.env["GITHUB_TOKEN"]) {
    return {
      provider: "github_models",
      model: process.env["AGENT_MODEL"] || "gpt-4o-mini",
      apiKey: process.env["GITHUB_TOKEN"],
      baseUrl: "https://models.inference.ai.azure.com",
      isFree: true,
    };
  }

  if (process.env["OLLAMA_BASE_URL"]) {
    return {
      provider: "ollama",
      model: process.env["AGENT_MODEL"] || "deepseek-r1",
      baseUrl: process.env["OLLAMA_BASE_URL"],
      isFree: true,
    };
  }

  return {
    provider: "simulated",
    model: process.env["AGENT_MODEL"] || "0x-alpha",
    isFree: true,
  };
}

/**
 * LLMRunner
 * Streams real tokens and reasoning thoughts from providers.
 */
export class LLMRunner {
  private _config: ProviderConfig;

  constructor(customConfig?: Partial<ProviderConfig>) {
    this._config = {
      ...detectFreeProvider(),
      ...(customConfig || {}),
    };
  }

  get config(): ProviderConfig {
    return this._config;
  }

  get activeModel(): string {
    return this._config.model;
  }

  /**
   * Dynamically switches active model or provider configuration.
   * Atomically updates provider, endpoint, AND authenticating API key without cross-provider leakage.
   */
  setModel(modelName: string): void {
    const targetProvider = detectProviderForModel(modelName);
    const targetApiKey = getProviderApiKey(targetProvider);
    const targetBaseUrl = getProviderDefaultBaseUrl(targetProvider);

    this._config = {
      provider: targetProvider,
      model: modelName,
      baseUrl: targetBaseUrl,
      apiKey: targetApiKey,
      isFree: true,
    };
  }

  /**
   * Streams chat completions from the active provider or simulated fallback.
   */
  async *streamChat(params: LLMStreamParams): AsyncIterable<StreamEventChunk> {
    let provider: FreeProvider = params.provider || this._config.provider;
    let model: string = params.model || this._config.model;
    let apiKey: string | undefined = params.apiKey || this._config.apiKey;
    let baseUrl: string =
      params.baseUrl ||
      (params.provider
        ? getProviderDefaultBaseUrl(params.provider)
        : this._config.baseUrl || getProviderDefaultBaseUrl(provider));

    // Handle BYOK overrides with strict provider routing
    if (params.byokConfig) {
      const byok = params.byokConfig;
      if (byok.provider === "openrouter") provider = "openrouter_free";
      else if (byok.provider === "groq") provider = "groq";
      else if (byok.provider === "gemini") provider = "gemini";
      else if (byok.provider === "openai") provider = "openai";
      else if (byok.provider === "anthropic") provider = "anthropic";
      else if (byok.provider === "custom") provider = "ollama";

      if (byok.model) model = byok.model;
      if (byok.apiKey) apiKey = byok.apiKey;
      // Only attach custom base URL if explicit custom/openrouter provider
      if (byok.baseUrl && (byok.provider === "custom" || byok.provider === "openrouter")) {
        baseUrl = byok.baseUrl;
      } else {
        baseUrl = getProviderDefaultBaseUrl(provider);
      }
    }

    // Anthropic Messages API routing
    if (provider === "anthropic") {
      if (!apiKey) {
        yield {
          type: "thought",
          text: "Anthropic API key missing. Falling back to local execution mode.",
        };
        yield* this._streamSimulated(params.messages);
        return;
      }
      try {
        for await (const chunk of this._streamAnthropic(
          params,
          model,
          apiKey,
          baseUrl,
          params.signal,
        )) {
          yield chunk;
        }
      } catch (err) {
        if (params.signal?.aborted) {
          yield { type: "thought", text: "Turn execution cancelled by client." };
          return;
        }
        yield {
          type: "thought",
          text: `Anthropic API error (${err instanceof Error ? err.message : String(err)}). Using local execution mode.`,
        };
        yield* this._streamSimulated(params.messages);
      }
      return;
    }

    if (provider === "simulated" || (!apiKey && provider !== "ollama")) {
      yield* this._streamSimulated(params.messages);
      return;
    }

    // Standard OpenAI-compatible SSE streaming (Gemini, Groq, OpenRouter, GitHub Models, Ollama / Custom)
    try {
      for await (const chunk of this._streamOpenAICompatible(
        provider,
        params,
        model,
        apiKey,
        baseUrl,
        params.signal,
      )) {
        yield chunk;
      }
    } catch (err) {
      if (params.signal?.aborted) {
        yield {
          type: "thought",
          text: "Turn execution cancelled by client.",
        };
        return;
      }
      yield {
        type: "thought",
        text: `Live LLM provider [${provider}] offline or key missing (${err instanceof Error ? err.message : String(err)}). Using local execution mode.`,
      };
      yield* this._streamSimulated(params.messages);
    }
  }

  /**
   * Anthropic Messages API streaming.
   */
  private async *_streamAnthropic(
    params: LLMStreamParams,
    model: string,
    apiKey: string,
    customBaseUrl?: string,
    signal?: AbortSignal,
  ): AsyncIterable<StreamEventChunk> {
    const baseUrl = customBaseUrl || "https://api.anthropic.com/v1";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };

    const systemMessage = params.messages.find((m) => m.role === "system")?.content || "";
    const conversationMessages = params.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

    const payload: Record<string, unknown> = {
      model,
      max_tokens: 4096,
      messages:
        conversationMessages.length > 0
          ? conversationMessages
          : [{ role: "user", content: "Hello" }],
      stream: true,
      temperature: 0.2,
    };
    if (systemMessage) {
      payload["system"] = systemMessage;
    }

    const fetchOptions: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    };
    if (signal) {
      fetchOptions.signal = signal;
    }

    const response = await fetch(`${baseUrl}/messages`, fetchOptions);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errText}`);
    }

    if (!response.body) {
      throw new Error("Anthropic API returned empty response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        return;
      }
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === "content_block_delta") {
            if (parsed.delta?.type === "text_delta" && parsed.delta.text) {
              yield { type: "token", text: parsed.delta.text };
            } else if (parsed.delta?.type === "thinking_delta" && parsed.delta.thinking) {
              yield { type: "thought", text: parsed.delta.thinking };
            }
          }
        } catch {
          // Ignore partial stream chunks
        }
      }
    }
  }

  /**
   * OpenAI-compatible SSE streaming for Groq, OpenRouter, GitHub Models, Ollama, Gemini, and OpenAI.
   */
  private async *_streamOpenAICompatible(
    provider: FreeProvider,
    params: LLMStreamParams,
    model: string,
    apiKey?: string,
    customBaseUrl?: string,
    signal?: AbortSignal,
  ): AsyncIterable<StreamEventChunk> {
    const baseUrl = customBaseUrl || getProviderDefaultBaseUrl(provider);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    if (provider === "openrouter_free") {
      headers["HTTP-Referer"] = "https://agent-remote.dev";
      headers["X-Title"] = "Agent Remote Harness";
    }

    const payload: Record<string, unknown> = {
      model,
      messages: params.messages,
      stream: true,
      temperature: 0.2,
    };

    if (params.tools && Array.isArray(params.tools) && params.tools.length > 0) {
      payload["tools"] = params.tools;
      if (params.toolChoice) {
        payload["tool_choice"] = params.toolChoice;
      }
    }

    const fetchOptions: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    };
    if (signal) {
      fetchOptions.signal = signal;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, fetchOptions);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM provider [${provider}] error (${response.status}): ${errText}`);
    }

    if (!response.body) {
      throw new Error(`LLM provider [${provider}] returned an empty response body`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let insideThinking = false;
    const accumulatedToolCalls: Map<number, { id: string; name: string; argsText: string }> =
      new Map();

    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        return;
      }

      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") continue;

        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr) as {
              choices?: Array<{
                delta?: {
                  content?: string;
                  reasoning_content?: string;
                  tool_calls?: Array<{
                    index?: number;
                    id?: string;
                    function?: {
                      name?: string;
                      arguments?: string;
                    };
                  }>;
                };
              }>;
            };

            const delta = data.choices?.[0]?.delta;
            if (!delta) continue;

            // 1. Check provider-native structured tool_calls delta
            if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                const existing = accumulatedToolCalls.get(idx) || {
                  id: tc.id || `call_${idx}_${Date.now()}`,
                  name: "",
                  argsText: "",
                };
                if (tc.id) existing.id = tc.id;
                if (tc.function?.name) existing.name += tc.function.name;
                if (tc.function?.arguments) existing.argsText += tc.function.arguments;
                accumulatedToolCalls.set(idx, existing);
              }
            }

            // 2. Check reasoning_content (DeepSeek R1 on Groq / OpenRouter)
            if (delta.reasoning_content) {
              yield { type: "thought", text: delta.reasoning_content };
            }

            // 3. Check regular content delta with <think> tag support
            if (delta.content) {
              let text = delta.content;

              if (text.includes("<think>")) {
                insideThinking = true;
                text = text.replace("<think>", "");
              }

              if (text.includes("</think>")) {
                insideThinking = false;
                const parts = text.split("</think>");
                if (parts[0]) yield { type: "thought", text: parts[0] };
                if (parts[1]) yield { type: "token", text: parts[1] };
                continue;
              }

              if (insideThinking) {
                yield { type: "thought", text };
              } else {
                yield { type: "token", text };
              }
            }
          } catch {
            // Partial JSON chunk, continue
          }
        }
      }
    }

    // 4. Yield accumulated structured tool calls when stream concludes
    if (accumulatedToolCalls.size > 0) {
      for (const [, tc] of accumulatedToolCalls) {
        if (!tc.name) continue;
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(tc.argsText || "{}");
        } catch {
          parsedArgs = { raw: tc.argsText };
        }
        yield {
          type: "tool_call",
          text: `Executing tool ${tc.name}`,
          toolCall: {
            id: tc.id,
            name: tc.name,
            args: parsedArgs,
          },
        };
      }
    }
  }

  /**
   * Simulated stream fallback when network is offline or no API key is available.
   */
  private async *_streamSimulated(messages: ChatMessageParam[]): AsyncIterable<StreamEventChunk> {
    const rawUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "Directive";

    // Extract the clean user request from Layer 5 prompt envelope if present
    const match = rawUserMessage.match(
      /=== LAYER 5: DYNAMIC USER DIRECTIVE ===\s*\n(?:User Request:\s*)?([\s\S]*)/i,
    );
    const cleanPrompt = (match && match[1] ? match[1] : rawUserMessage).trim();

    yield {
      type: "thought",
      text: `Processing directive: "${cleanPrompt.slice(0, 60)}"`,
    };

    yield {
      type: "token",
      text: `[Agent Harness Offline Mode]\nProcessed request: "${cleanPrompt}"\n\n[Notice]: Network dropped or LLM provider endpoint is unreachable. To enable live frontier AI inference, check your connection or configure an API key in the BYOK Settings.`,
    };
  }
}
