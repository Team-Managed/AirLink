import { vi } from "vitest";

export const StatusBarAlignment = {
  Left: 1,
  Right: 2,
};

export const workspace = {
  workspaceFolders: [{ uri: { fsPath: "/mock/workspace" } }],
  getConfiguration: vi.fn(() => ({
    get: vi.fn((key: string) => {
      if (key === "relayUrl") return "http://localhost:3001";
      if (key === "model") return "0x-alpha";
      return undefined;
    }),
  })),
};

export const window = {
  registerWebviewViewProvider: vi.fn(() => ({ dispose: vi.fn() })),
  createStatusBarItem: vi.fn(() => ({
    command: "",
    text: "",
    tooltip: "",
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  })),
  showWarningMessage: vi.fn(() => Promise.resolve("Approve")),
  showInformationMessage: vi.fn(() => Promise.resolve(undefined)),
  showErrorMessage: vi.fn(() => Promise.resolve(undefined)),
  showInputBox: vi.fn(() => Promise.resolve("42")),
};

export const commands = {
  registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
  executeCommand: vi.fn(() => Promise.resolve(undefined)),
};

export const env = {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
};

export const Uri = {
  file: (path: string) => ({ fsPath: path, scheme: "file" }),
  parse: (uri: string) => ({ fsPath: uri, scheme: "file" }),
};
