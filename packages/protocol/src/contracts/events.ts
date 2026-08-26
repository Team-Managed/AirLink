import { z } from "zod";

/**
 * Supported LLM Providers for Bring-Your-Own-Key (BYOK) model routing.
 */
export const LLMProviderSchema = z.enum(["openrouter", "anthropic", "openai", "custom"]);
export type LLMProvider = z.infer<typeof LLMProviderSchema>;

/**
 * BYOK Configuration passed from client or stored securely in keychain.
 */
export const BYOKConfigSchema = z.object({
  provider: LLMProviderSchema,
  model: z.string().min(1, "Model identifier is required"),
  apiKey: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
});
export type BYOKConfig = z.infer<typeof BYOKConfigSchema>;

/**
 * RegisterHost: Sent by Workstation CLI or VS Code Extension to initialize a pairing room.
 */
export const RegisterHostSchema = z.object({
  pin: z.string().length(6, "PIN must be exactly 6 characters"),
  hostName: z.string().min(1, "Host name is required"),
  workspacePath: z.string().min(1, "Workspace path is required"),
});
export type RegisterHost = z.infer<typeof RegisterHostSchema>;

/**
 * JoinSession: Sent by Mobile App or Web Client to connect to an active host room.
 */
export const JoinSessionSchema = z.object({
  pin: z.string().length(6, "PIN must be exactly 6 characters"),
  clientName: z.string().default("Mobile App"),
});
export type JoinSession = z.infer<typeof JoinSessionSchema>;

/**
 * SessionConnected: Broadcast when mobile/web client successfully pairs with workstation.
 */
export const SessionConnectedSchema = z.object({
  sessionId: z.string().min(1),
  deviceName: z.string(),
  workspacePath: z.string(),
  status: z.enum(["connected", "disconnected"]),
  connectedAt: z.number().default(() => Date.now()),
});
export type SessionConnected = z.infer<typeof SessionConnectedSchema>;

/**
 * ClientPrompt: User instruction sent from Mobile/Web remote to developer workstation.
 */
export const ClientPromptSchema = z.object({
  sessionId: z.string().min(1),
  prompt: z.string().min(1, "Prompt cannot be empty"),
  turnId: z.string().default(() => `turn_${Date.now()}`),
  byokConfig: BYOKConfigSchema.optional(),
});
export type ClientPrompt = z.infer<typeof ClientPromptSchema>;

/**
 * Stream Event Types emitted by the agent engine.
 */
export const StreamEventTypeSchema = z.enum([
  "thought",
  "token",
  "tool_call",
  "tool_result",
  "error",
  "done",
]);
export type StreamEventType = z.infer<typeof StreamEventTypeSchema>;

/**
 * Tool execution metadata attached to stream events.
 */
export const ToolMetadataSchema = z.object({
  name: z.string(),
  args: z.record(z.unknown()).default({}),
  durationMs: z.number().nonnegative().optional(),
  exitCode: z.number().int().optional(),
});
export type ToolMetadata = z.infer<typeof ToolMetadataSchema>;

/**
 * AgentStream: Real-time token or thought event emitted with monotonic sequence ID.
 */
export const AgentStreamSchema = z.object({
  seqId: z.number().int().positive("Sequence ID must be a positive integer"),
  sessionId: z.string().min(1),
  turnId: z.string().min(1),
  type: StreamEventTypeSchema,
  content: z.string(),
  metadata: ToolMetadataSchema.optional(),
  timestamp: z.number().default(() => Date.now()),
});
export type AgentStream = z.infer<typeof AgentStreamSchema>;

/**
 * Risk levels for destructive tool approvals.
 */
export const RiskLevelSchema = z.enum(["low", "medium", "high"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const APPROVAL_TIMEOUT_MS = 180000;
export const MAX_RING_BUFFER_SIZE = 500;

/**
 * ApprovalRequest: Emitted when an agent tool requires Human-in-the-Loop confirmation.
 */
export const ApprovalRequestSchema = z.object({
  seqId: z.number().int().positive(),
  approvalId: z.string().min(1, "Approval ID is required"),
  sessionId: z.string().min(1),
  turnId: z.string().min(1),
  toolName: z.string().min(1),
  commandOrDiff: z.string(),
  riskLevel: RiskLevelSchema,
  description: z.string().optional(),
  timeoutMs: z
    .number()
    .int("timeoutMs must be an integer")
    .positive("timeoutMs must be positive")
    .max(APPROVAL_TIMEOUT_MS, `timeoutMs cannot exceed ${APPROVAL_TIMEOUT_MS}ms (180s)`)
    .default(APPROVAL_TIMEOUT_MS),
  createdAt: z.number().default(() => Date.now()),
});
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

/**
 * ApprovalResponse: Human response resolving a pending tool execution.
 */
export const ApprovalResponseSchema = z.object({
  approvalId: z.string().min(1),
  sessionId: z.string().min(1),
  approved: z.boolean(),
  reason: z.string().optional(),
  resolvedAt: z.number().default(() => Date.now()),
});
export type ApprovalResponse = z.infer<typeof ApprovalResponseSchema>;

/**
 * ClientSync: Sent by reconnecting clients to catch up on missed stream events.
 */
export const ClientSyncSchema = z.object({
  sessionId: z.string().min(1),
  lastSeenSeq: z.number().int().nonnegative("lastSeenSeq must be non-negative"),
});
export type ClientSync = z.infer<typeof ClientSyncSchema>;

/**
 * StreamBatch: Catch-up batch of stream events replayed from the in-memory ring buffer.
 */
export const StreamBatchSchema = z
  .object({
    sessionId: z.string().min(1),
    events: z
      .array(AgentStreamSchema)
      .max(
        MAX_RING_BUFFER_SIZE,
        `Batch cannot exceed maximum ring buffer bound (${MAX_RING_BUFFER_SIZE})`,
      ),
  })
  .refine((data) => data.events.every((event) => event.sessionId === data.sessionId), {
    message: "All stream batch events must match the batch sessionId",
    path: ["events"],
  });
export type StreamBatch = z.infer<typeof StreamBatchSchema>;

/**
 * Standard structured error contract.
 */
export const StandardErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.unknown().optional(),
});
export type StandardError = z.infer<typeof StandardErrorSchema>;
