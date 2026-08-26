import { describe, it, expect, vi } from "vitest";
import { generateSessionPin, formatPin } from "../src/extension.js";
import { AgentChatViewProvider } from "../src/chat-webview.js";
import type * as vscode from "vscode";

describe("VS Code Extension Suite", () => {
  describe("generateSessionPin", () => {
    it("generates a random 6-digit numeric string", () => {
      const pin1 = generateSessionPin();
      const pin2 = generateSessionPin();

      expect(pin1).toMatch(/^\d{6}$/);
      expect(pin2).toMatch(/^\d{6}$/);
    });
  });

  describe("formatPin", () => {
    it("formats 6-digit PIN with hyphen", () => {
      expect(formatPin("834192")).toBe("834-192");
      expect(formatPin("999111")).toBe("999-111");
    });

    it("handles already formatted or non-6 digit inputs cleanly", () => {
      expect(formatPin("834-192")).toBe("834-192");
      expect(formatPin("123")).toBe("123");
    });
  });

  describe("AgentChatViewProvider", () => {
    it("generates complete HTML for the chat webview with tokens, dark styling, and inputs", () => {
      const mockUri = { fsPath: "/mock/path", scheme: "file" } as unknown as vscode.Uri;
      const provider = new AgentChatViewProvider(mockUri);

      const mockWebview = {} as vscode.Webview;
      const html = provider.getHtmlForWebview(mockWebview);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Agent Remote Chat");
      expect(html).toContain('id="header"');
      expect(html).toContain('id="messages"');
      expect(html).toContain('id="quick-actions"');
      expect(html).toContain('id="prompt-input"');
      expect(html).toContain("🐙 Create PR");
      expect(html).toContain("🧪 Run Tests");
      expect(html).toContain("🔍 Git Diff");
    });

    it("registers prompt and approval response callbacks", () => {
      const mockUri = { fsPath: "/mock/path", scheme: "file" } as unknown as vscode.Uri;
      const provider = new AgentChatViewProvider(mockUri);

      const promptSpy = vi.fn();
      const approvalSpy = vi.fn();

      provider.onPrompt(promptSpy);
      provider.onApprovalResponse(approvalSpy);

      provider.setSessionInfo("834-192", "http://localhost:3001", "0x-alpha");
      expect(promptSpy).not.toHaveBeenCalled();
    });
  });

  describe("Extension Lifecycle", () => {
    it("activates and registers status bar item, chat view provider, and commands", async () => {
      const { activate, deactivate } = await import("../src/extension.js");
      const mockContext = {
        subscriptions: [],
        extensionUri: { fsPath: "/mock/ext", scheme: "file" },
      } as unknown as vscode.ExtensionContext;

      activate(mockContext);

      expect(mockContext.subscriptions.length).toBeGreaterThan(0);

      // Clean disposal
      deactivate();
    });
  });
});
