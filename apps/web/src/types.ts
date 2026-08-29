import type {
  SessionConnected,
  ApprovalRequest,
  ToolMetadata,
  StreamEventType,
} from "@airlink/protocol";

export type InstallTab = "windows" | "posix" | "npx";

export type SimStep = "pending_approval" | "approved_executing" | "completed";

export interface WebFeedItem {
  id: string;
  seqId: number;
  type: StreamEventType;
  content: string;
  role?: "user" | "agent" | undefined;
  metadata?: ToolMetadata | undefined;
  timestamp: number;
}

export interface QuickActionItem {
  label: string;
  prompt: string;
}

export interface UseWebSessionOptions {
  initialPin?: string | undefined;
  initialRelayUrl?: string | undefined;
}

export interface UseWebSessionReturn {
  pin: string;
  relayUrl: string;
  isConnecting: boolean;
  isConnected: boolean;
  errorBanner: string | null;
  reconnectToast: string | null;
  sessionData: SessionConnected | null;
  feedItems: WebFeedItem[];
  activeApproval: ApprovalRequest | null;
  isStreaming: boolean;
  provider: string;
  model: string;
  apiKey: string;
  showApiKey: boolean;
  setPin: (pin: string) => void;
  setRelayUrl: (url: string) => void;
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setApiKey: (key: string) => void;
  setShowApiKey: (show: boolean) => void;
  connect: (pinToUse?: string) => void;
  disconnect: () => void;
  sendPrompt: (text: string) => void;
  approve: (approvalId: string) => void;
  deny: (approvalId: string, reason?: string) => void;
  clearError: () => void;
}
