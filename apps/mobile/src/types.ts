import type {
  AgentStream,
  ApprovalRequest,
  BYOKConfig,
  RiskLevel,
  SessionConnected,
  StandardError,
  StreamBatch,
  StreamEventType,
  ToolMetadata,
} from "@airlink/protocol";

export type ConnectionStatus = "disconnected" | "connecting" | "paired" | "reconnecting";

export type FeedItemRole = "user" | "agent" | "system";

export interface StreamFeedItem {
  id: string;
  seqId: number;
  type: StreamEventType;
  content: string;
  role?: FeedItemRole | undefined;
  metadata?: ToolMetadata | undefined;
  timestamp: number;
  collapsed?: boolean;
}

export interface ParsedDiffLine {
  type: "add" | "delete" | "context" | "header";
  content: string;
  oldLineNumber?: number | undefined;
  newLineNumber?: number | undefined;
}

export interface ParsedHunk {
  header: string;
  lines: ParsedDiffLine[];
}

export interface ParsedDiff {
  filePath: string;
  oldFile: string;
  newFile: string;
  additions: number;
  deletions: number;
  hunks: ParsedHunk[];
}

export interface MobileSessionState {
  status: ConnectionStatus;
  pin: string | null;
  sessionData: SessionConnected | null;
  feedItems: StreamFeedItem[];
  activeApproval: ApprovalRequest | null;
  activeModel: string;
  activeBranch: string;
  errorBanner: string | null;
  isAutoScrollLocked: boolean;
  isSubmittingPrompt: boolean;
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: string;
  promptText: string;
}

export {
  AgentStream,
  ApprovalRequest,
  BYOKConfig,
  RiskLevel,
  SessionConnected,
  StandardError,
  StreamBatch,
  StreamEventType,
  ToolMetadata,
};
