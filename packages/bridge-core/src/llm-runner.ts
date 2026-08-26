export type FreeProvider =
  | "groq"
  | "gemini"
  | "openrouter_free"
  | "github_models"
  | "ollama"
  | "simulated";

export interface ProviderConfig {
  provider: FreeProvider;
  model: string;
  apiKey?: string | undefined;
  baseUrl?: string | undefined;
  isFree: true;
}

export interface ChatMessageParam {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMStreamParams {
  messages: ChatMessageParam[];
  model?: string | undefined;
  provider?: FreeProvider | undefined;
  apiKey?: string | undefined;
}

export interface StreamEventChunk {
  type: "thought" | "token";
  text: string;
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
  gemini: [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
  ],
  openrouter_free: [
    "deepseek/deepseek-r1:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen-2.5-coder-32b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
  ],
  github_models: [
    "gpt-4o",
    "gpt-4o-mini",
    "Meta-Llama-3.3-70B-Instruct",
    "DeepSeek-R1",
  ],
  ollama: [
    "deepseek-r1",
    "llama3.3",
    "qwen2.5-coder",
  ],
} as const;

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

  /**
   * Dynamically switches active model or provider configuration.
   */
  setModel(modelName: string): void {
    const isKnownProvider = Object.values(FREE_MODELS).some((list) =>
      list.includes(modelName as never),
    );

    if (isKnownProvider) {
      if (FREE_MODELS.groq.includes(modelName as never)) {
        this._config.provider = "groq";
        this._config.baseUrl = "https://api.groq.com/openai/v1";
      } else if (FREE_MODELS.gemini.includes(modelName as never)) {
        this._config.provider = "gemini";
        this._config.baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";
      } else if (FREE_MODELS.openrouter_free.includes(modelName as never)) {
        this._config.provider = "openrouter_free";
        this._config.baseUrl = "https://openrouter.ai/api/v1";
      } else if (FREE_MODELS.github_models.includes(modelName as never)) {
        this._config.provider = "github_models";
        this._config.baseUrl = "https://models.inference.ai.azure.com";
      } else if (FREE_MODELS.ollama.includes(modelName as never)) {
        this._config.provider = "ollama";
        this._config.baseUrl = "http://localhost:11434/v1";
      }
    }

    this._config.model = modelName;
  }

  public setProvider(provider: FreeProvider, apiKey?: string, baseUrl?: string): void {
    this._config.provider = provider;
    if (apiKey) this._config.apiKey = apiKey;
    if (baseUrl) this._config.baseUrl = baseUrl;
  }

  /**
   * Streams chat completions from the active provider.
   */
  async *streamChat(params: LLMStreamParams): AsyncIterable<StreamEventChunk> {
    const provider = params.provider || this._config.provider;
    const model = params.model || this._config.model;
    const apiKey = params.apiKey || this._config.apiKey;

    if (provider === "simulated" || !apiKey && provider !== "ollama") {
      yield* this._streamSimulated(params.messages);
      return;
    }

    // Standard OpenAI-compatible SSE streaming (Gemini, Groq, OpenRouter, GitHub Models, Ollama)
    yield* this._streamOpenAICompatible(provider, params.messages, model, apiKey, this._config.baseUrl);
  }

  /**
   * OpenAI-compatible SSE streaming for Groq, OpenRouter, GitHub Models, and Ollama.
   */
  private async *_streamOpenAICompatible(
    provider: FreeProvider,
    messages: ChatMessageParam[],
    model: string,
    apiKey?: string,
    customBaseUrl?: string,
  ): AsyncIterable<StreamEventChunk> {
    let baseUrl = customBaseUrl;
    if (!baseUrl) {
      if (provider === "groq") baseUrl = "https://api.groq.com/openai/v1";
      else if (provider === "openrouter_free") baseUrl = "https://openrouter.ai/api/v1";
      else if (provider === "github_models") baseUrl = "https://models.inference.ai.azure.com";
      else if (provider === "ollama") baseUrl = "http://localhost:11434/v1";
      else baseUrl = "https://api.groq.com/openai/v1";
    }

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

    const payload = {
      model,
      messages,
      stream: true,
      temperature: 0.2,
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

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

    while (true) {
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
                };
              }>;
            };

            const delta = data.choices?.[0]?.delta;
            if (!delta) continue;

            // 1. Check reasoning_content (DeepSeek R1 on Groq / OpenRouter)
            if (delta.reasoning_content) {
              yield { type: "thought", text: delta.reasoning_content };
            }

            // 2. Check regular content delta with <think> tag support
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
  }

  /**
   * Simulated stream fallback when no free API key is configured.
   */
  private async *_streamSimulated(messages: ChatMessageParam[]): AsyncIterable<StreamEventChunk> {
    const lastUserPrompt = messages.filter((m) => m.role === "user").pop()?.content || "Directive";

    yield {
      type: "thought",
      text: `Analyzing directive in local test mode: "${lastUserPrompt.slice(0, 60)}"`,
    };

    yield {
      type: "token",
      text: `[Agent Harness]: Processed request: "${lastUserPrompt}".\n\n💡 Tip: To enable real live LLM inference with 100% free models, add any free API key to your .env:\n  - GROQ_API_KEY (Free on console.groq.com)\n  - GEMINI_API_KEY (Free on aistudio.google.com)\n  - OPENROUTER_API_KEY (Free models on openrouter.ai)\n  - GITHUB_TOKEN (Free GitHub Models)`,
    };
  }
}
