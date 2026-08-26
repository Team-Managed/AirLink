import { z } from "zod";
import {
  LLMProviderSchema,
  LLMProvider,
  BYOKConfigSchema,
  BYOKConfig,
  RegisterHostSchema,
  RegisterHost,
  JoinSessionSchema,
  JoinSession,
  SessionConnectedSchema,
  SessionConnected,
  ClientPromptSchema,
  ClientPrompt,
  StreamEventTypeSchema,
  StreamEventType,
  ToolMetadataSchema,
  ToolMetadata,
  AgentStreamSchema,
  AgentStream,
  RiskLevelSchema,
  RiskLevel,
  ApprovalRequestSchema,
  ApprovalRequest,
  ApprovalResponseSchema,
  ApprovalResponse,
  ClientSyncSchema,
  ClientSync,
  StreamBatchSchema,
  StreamBatch,
  StandardErrorSchema,
  StandardError,
} from "./contracts/events.js";

// Re-export all schemas and inferred types
export * from "./contracts/events.js";

/**
 * Socket.io Event Name Constants used across Relay, Hosts, and Clients.
 */
export const SOCKET_EVENTS = {
  REGISTER_HOST: "host:register",
  JOIN_SESSION: "client:join",
  SESSION_CONNECTED: "session:connected",
  CLIENT_PROMPT: "client:prompt",
  AGENT_STREAM: "agent:stream",
  APPROVAL_REQUIRED: "agent:approval_required",
  APPROVAL_RESPONSE: "client:approval_response",
  CLIENT_SYNC: "client:sync",
  STREAM_BATCH: "agent:stream_batch",
  ERROR: "session:error",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

/**
 * Generic synchronous validation helper that throws a ZodError if invalid.
 */
export function validatePayload<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Generic safe validation helper that returns a SafeParseReturnType.
 */
export function safeValidatePayload<T>(
  schema: z.ZodType<T>,
  data: unknown,
): z.SafeParseReturnType<unknown, T> {
  return schema.safeParse(data);
}

/**
 * Specialized parser functions for protocol contracts
 */
export function parseLLMProvider(data: unknown): LLMProvider {
  return LLMProviderSchema.parse(data);
}

export function parseBYOKConfig(data: unknown): BYOKConfig {
  return BYOKConfigSchema.parse(data);
}

export function parseRegisterHost(data: unknown): RegisterHost {
  return RegisterHostSchema.parse(data);
}

export function parseJoinSession(data: unknown): JoinSession {
  return JoinSessionSchema.parse(data);
}

export function parseSessionConnected(data: unknown): SessionConnected {
  return SessionConnectedSchema.parse(data);
}

export function parseClientPrompt(data: unknown): ClientPrompt {
  return ClientPromptSchema.parse(data);
}

export function parseStreamEventType(data: unknown): StreamEventType {
  return StreamEventTypeSchema.parse(data);
}

export function parseToolMetadata(data: unknown): ToolMetadata {
  return ToolMetadataSchema.parse(data);
}

export function parseAgentStream(data: unknown): AgentStream {
  return AgentStreamSchema.parse(data);
}

export function parseRiskLevel(data: unknown): RiskLevel {
  return RiskLevelSchema.parse(data);
}

export function parseApprovalRequest(data: unknown): ApprovalRequest {
  return ApprovalRequestSchema.parse(data);
}

export function parseApprovalResponse(data: unknown): ApprovalResponse {
  return ApprovalResponseSchema.parse(data);
}

export function parseClientSync(data: unknown): ClientSync {
  return ClientSyncSchema.parse(data);
}

export function parseStreamBatch(data: unknown): StreamBatch {
  return StreamBatchSchema.parse(data);
}

export function parseStandardError(data: unknown): StandardError {
  return StandardErrorSchema.parse(data);
}

/**
 * Type Guard Helpers for runtime event discrimination
 */
export function isBYOKConfig(data: unknown): data is BYOKConfig {
  return BYOKConfigSchema.safeParse(data).success;
}

export function isRegisterHost(data: unknown): data is RegisterHost {
  return RegisterHostSchema.safeParse(data).success;
}

export function isJoinSession(data: unknown): data is JoinSession {
  return JoinSessionSchema.safeParse(data).success;
}

export function isSessionConnected(data: unknown): data is SessionConnected {
  return SessionConnectedSchema.safeParse(data).success;
}

export function isClientPrompt(data: unknown): data is ClientPrompt {
  return ClientPromptSchema.safeParse(data).success;
}

export function isAgentStream(data: unknown): data is AgentStream {
  return AgentStreamSchema.safeParse(data).success;
}

export function isApprovalRequest(data: unknown): data is ApprovalRequest {
  return ApprovalRequestSchema.safeParse(data).success;
}

export function isApprovalResponse(data: unknown): data is ApprovalResponse {
  return ApprovalResponseSchema.safeParse(data).success;
}

export function isClientSync(data: unknown): data is ClientSync {
  return ClientSyncSchema.safeParse(data).success;
}

export function isStreamBatch(data: unknown): data is StreamBatch {
  return StreamBatchSchema.safeParse(data).success;
}

export function isStandardError(data: unknown): data is StandardError {
  return StandardErrorSchema.safeParse(data).success;
}
