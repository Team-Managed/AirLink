import type * as vscode from "vscode";
import type { AgentStream, ApprovalRequest } from "@agent-remote/protocol";

export interface ChatMessage {
  id: string;
  sender: "user_local" | "user_remote" | "agent" | "system";
  type: "text" | "thought" | "tool_call" | "tool_result" | "approval_request" | "done" | "error";
  content: string;
  metadata?: Record<string, unknown> | undefined;
  timestamp: number;
}

export type WebviewPromptHandler = (prompt: string) => void;
export type WebviewApprovalResponseHandler = (approvalId: string, approved: boolean) => void;
export type WebviewActionHandler = (action: string, arg?: string) => void;

/**
 * AgentChatViewProvider
 * Implements vscode.WebviewViewProvider for the Activity Bar Agent Remote Chat sidebar.
 */
export class AgentChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "agentRemote.chatView";
  private _view?: vscode.WebviewView;
  private readonly _messages: ChatMessage[] = [];
  private _activePin: string = "";
  private _relayUrl: string = "";
  private _model: string = "llama-3.3-70b-versatile";
  private _provider: string = "Groq (Free)";
  private _onPromptHandler?: WebviewPromptHandler;
  private _onApprovalResponseHandler?: WebviewApprovalResponseHandler;
  private _onActionHandler?: WebviewActionHandler;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public setSessionInfo(
    pin: string,
    relayUrl: string,
    model: string,
    provider: string = "Free Tier",
  ): void {
    this._activePin = pin;
    this._relayUrl = relayUrl;
    this._model = model;
    this._provider = provider;
    this._updateSessionHeader();
  }

  public onPrompt(handler: WebviewPromptHandler): void {
    this._onPromptHandler = handler;
  }

  public onApprovalResponse(handler: WebviewApprovalResponseHandler): void {
    this._onApprovalResponseHandler = handler;
  }

  public onAction(handler: WebviewActionHandler): void {
    this._onActionHandler = handler;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(
      (data: {
        command: string;
        text?: string;
        approvalId?: string;
        approved?: boolean;
        action?: string;
        arg?: string;
      }) => {
        switch (data.command) {
          case "ready":
            this._updateSessionHeader();
            for (const msg of this._messages) {
              this._postMessageToWebview({ command: "appendMessage", message: msg });
            }
            break;
          case "submitPrompt":
            if (data.text && this._onPromptHandler) {
              this._onPromptHandler(data.text);
            }
            break;
          case "submitApproval":
            if (data.approvalId && data.approved !== undefined && this._onApprovalResponseHandler) {
              this._onApprovalResponseHandler(data.approvalId, data.approved);
            }
            break;
          case "triggerAction":
            if (data.action && this._onActionHandler) {
              this._onActionHandler(data.action, data.arg);
            }
            break;
        }
      },
    );

    this._updateSessionHeader();
  }

  /**
   * Pushes a local user prompt message into the chat view.
   */
  public addLocalUserMessage(prompt: string): void {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user_local",
      type: "text",
      content: prompt,
      timestamp: Date.now(),
    };
    this._messages.push(msg);
    this._postMessageToWebview({ command: "appendMessage", message: msg });
  }

  /**
   * Pushes a remote user prompt message into the chat view.
   */
  public addRemoteUserMessage(prompt: string): void {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user_remote",
      type: "text",
      content: prompt,
      timestamp: Date.now(),
    };
    this._messages.push(msg);
    this._postMessageToWebview({ command: "appendMessage", message: msg });
  }

  /**
   * Pushes a system or tool notification card into the chat view.
   */
  public addSystemMessage(content: string): void {
    const msg: ChatMessage = {
      id: `sys_${Date.now()}`,
      sender: "system",
      type: "text",
      content,
      timestamp: Date.now(),
    };
    this._messages.push(msg);
    this._postMessageToWebview({ command: "appendMessage", message: msg });
  }

  /**
   * Streams an AgentStream chunk to the chat view.
   */
  public handleStreamChunk(chunk: AgentStream): void {
    this._postMessageToWebview({ command: "streamChunk", chunk });
  }

  /**
   * Displays an interactive approval request card inside the chat stream.
   */
  public handleApprovalRequest(request: ApprovalRequest): void {
    this._postMessageToWebview({ command: "approvalRequired", request });
  }

  /**
   * Updates an approval card state when resolved.
   */
  public handleApprovalResolved(approvalId: string, approved: boolean): void {
    this._postMessageToWebview({ command: "approvalResolved", approvalId, approved });
  }

  /**
   * Clears the messages in the webview.
   */
  public clearMessages(): void {
    this._messages.length = 0;
    this._postMessageToWebview({ command: "clearMessages" });
  }

  private _updateSessionHeader(): void {
    this._postMessageToWebview({
      command: "updateSession",
      pin: this._activePin,
      relayUrl: this._relayUrl,
      model: this._model,
      provider: this._provider,
    });
  }

  private _postMessageToWebview(message: unknown): void {
    if (this._view) {
      void this._view.webview.postMessage(message);
    }
  }

  public getHtmlForWebview(_webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- VS Code webview CSP: inline scripts allowed, no inline event handlers -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>Agent Remote Chat</title>
  <style>
    :root {
      --bg-base: var(--vscode-editor-background, #090d16);
      --bg-card: var(--vscode-sideBar-background, #0f172a);
      --border-color: var(--vscode-panel-border, #1e293b);
      --accent-blue: #38bdf8;
      --accent-green: #22c55e;
      --accent-red: #ef4444;
      --accent-yellow: #f59e0b;
      --accent-purple: #a855f7;
      --text-main: var(--vscode-editor-foreground, #f8fafc);
      --text-dim: var(--vscode-descriptionForeground, #94a3b8);
      --font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace);
    }
    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-base);
      color: var(--text-main);
      font-family: var(--font-family);
      font-size: 13px;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    #header {
      padding: 10px 12px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pin-badge {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid var(--accent-green);
      color: var(--accent-green);
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-family: monospace;
      cursor: pointer;
    }
    .model-chip {
      color: var(--text-dim);
      font-size: 11px;
    }
    #messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .message-card {
      padding: 8px 12px;
      border-radius: 6px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      max-width: 95%;
      word-break: break-word;
    }
    .msg-user-local {
      align-self: flex-end;
      background: rgba(56, 189, 248, 0.15);
      border-color: rgba(56, 189, 248, 0.4);
    }
    .msg-user-remote {
      align-self: flex-end;
      background: rgba(168, 85, 247, 0.15);
      border-color: rgba(168, 85, 247, 0.4);
    }
    .msg-system {
      align-self: center;
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--border-color);
      font-size: 12px;
    }
    .badge-tag {
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 4px;
      display: block;
      color: var(--accent-blue);
    }
    .thought-block {
      font-style: italic;
      color: var(--text-dim);
      border-left: 2px solid var(--border-color);
      padding-left: 8px;
      margin: 4px 0;
    }
    .tool-block {
      background: #020617;
      padding: 6px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
      margin: 4px 0;
      border: 1px solid var(--border-color);
      white-space: pre-wrap;
    }
    .approval-box {
      border: 1px solid var(--accent-yellow);
      background: rgba(245, 158, 11, 0.08);
      border-radius: 6px;
      padding: 10px;
    }
    .approval-title {
      font-weight: bold;
      color: var(--accent-yellow);
      margin-bottom: 6px;
    }
    .approval-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    .btn {
      padding: 5px 12px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
    }
    .btn-approve {
      background: var(--accent-green);
      color: #000;
    }
    .btn-deny {
      background: var(--accent-red);
      color: #fff;
    }
    #quick-actions {
      display: flex;
      gap: 6px;
      padding: 6px 12px;
      overflow-x: auto;
      border-top: 1px solid var(--border-color);
      background: var(--bg-card);
    }
    .pill-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-dim);
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      cursor: pointer;
      white-space: nowrap;
    }
    .pill-btn:hover {
      color: var(--text-main);
      border-color: var(--accent-blue);
    }
    #input-area {
      padding: 10px 12px;
      background: var(--bg-card);
      display: flex;
      gap: 8px;
    }
    #prompt-input {
      flex: 1;
      background: var(--bg-base);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 8px 10px;
      border-radius: 4px;
      resize: none;
      height: 36px;
      box-sizing: border-box;
      font-family: inherit;
    }
    #prompt-input:focus {
      outline: 1px solid var(--accent-blue);
      border-color: var(--accent-blue);
    }
    #send-btn {
      background: var(--accent-blue);
      color: #000;
      border: none;
      padding: 0 14px;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="header">
    <div style="display:flex; flex-direction:column; gap:2px;">
      <span class="model-chip" id="model-label">Loading model...</span>
      <span style="font-size:10px; color:var(--text-dim);">Click PIN to pair/enter session</span>
    </div>
    <div style="display:flex; gap:6px; align-items:center;">
      <span class="pin-badge" id="pin-label" data-action="setPin" title="Click to set or pair custom PIN">PIN: ---</span>
      <button class="pill-btn" id="copy-pin-btn" style="padding:2px 6px; font-size:10px;" title="Copy pairing URL">Copy</button>
    </div>
  </div>

  <div id="messages"></div>

  <div id="quick-actions">
    <button class="pill-btn" data-action="diff">Git Diff</button>
    <button class="pill-btn" data-action="test">Run Tests</button>
    <button class="pill-btn" data-action="lint">Typecheck</button>
    <button class="pill-btn" data-action="stats">Stats</button>
    <button class="pill-btn" data-action="setPin">Set PIN</button>
    <button class="pill-btn" data-action="clear">Clear</button>
    <button class="pill-btn" data-prompt="Create a pull request with all session changes and test results.">Create PR</button>
  </div>

  <div id="input-area">
    <textarea id="prompt-input" placeholder="Prompt AI agent or type /help for commands..."></textarea>
    <button id="send-btn">Send</button>
  </div>

  <script>
    (function() {
      const vscode = acquireVsCodeApi();
      const messagesEl = document.getElementById('messages');
      const promptInput = document.getElementById('prompt-input');
      const pinLabel = document.getElementById('pin-label');
      const modelLabel = document.getElementById('model-label');
      let currentTokenBlock = null;

      // ── Messaging helpers ──────────────────────────────────────────────────
      function sendAction(action, arg) {
        vscode.postMessage({ command: 'triggerAction', action: action, arg: arg });
        currentTokenBlock = null;
      }

      function sendPrompt(text) {
        vscode.postMessage({ command: 'submitPrompt', text: text });
        currentTokenBlock = null;
      }

      function handleSend() {
        const text = promptInput.value.trim();
        if (!text) return;

        if (text.startsWith('/diff')) {
          sendAction('diff');
        } else if (text.startsWith('/clear') || text.startsWith('/reset')) {
          sendAction('clear');
        } else if (text.startsWith('/test')) {
          sendAction('test', text.slice(5).trim());
        } else if (text.startsWith('/lint')) {
          sendAction('lint');
        } else if (text.startsWith('/stats')) {
          sendAction('stats');
        } else {
          sendPrompt(text);
        }

        promptInput.value = '';
        currentTokenBlock = null;
      }

      // ── Static button wiring (no inline handlers) ──────────────────────────
      document.getElementById('send-btn').addEventListener('click', handleSend);
      document.getElementById('copy-pin-btn').addEventListener('click', function() { sendAction('copyPin'); });
      document.getElementById('pin-label').addEventListener('click', function() { sendAction('setPin'); });

      // Wire all quick-action pill buttons via data-action / data-prompt attributes
      document.getElementById('quick-actions').addEventListener('click', function(e) {
        const btn = e.target.closest('[data-action]');
        const promptBtn = e.target.closest('[data-prompt]');
        if (btn) {
          sendAction(btn.dataset.action, btn.dataset.arg);
        } else if (promptBtn) {
          sendPrompt(promptBtn.dataset.prompt);
        }
      });

      // Enter key in textarea (no shift)
      promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });

      // Approval button clicks — event delegation on messages container
      // Delegate approval clicks
      if (messagesEl) {
        messagesEl.addEventListener('click', function(e) {
          const approveBtn = e.target.closest('[data-approve]');
          const denyBtn    = e.target.closest('[data-deny]');
          if (approveBtn) {
            respondApproval(approveBtn.dataset.approve, true);
          } else if (denyBtn) {
            respondApproval(denyBtn.dataset.deny, false);
          }
        });
      }

      // Handle messages from the extension host
      window.addEventListener('message', function(event) {
        const msg = event.data;
        if (!msg) return;

        switch (msg.command) {
          case 'updateSession':
            const pinEl = document.getElementById('pin-label');
            if (pinEl) pinEl.textContent = msg.pin ? 'PIN: ' + msg.pin : 'PIN: ---';
            const modelEl = document.getElementById('model-label');
            if (modelEl) modelEl.textContent = (msg.provider || 'Free Tier') + ': ' + (msg.model || 'llama-3.3-70b-versatile');
            break;
          case 'appendMessage':
            appendMessage(msg.message);
            break;
          case 'streamChunk':
            handleStreamChunk(msg.chunk);
            break;
          case 'approvalRequired':
            renderApprovalCard(msg.request);
            break;
          case 'approvalResolved':
            resolveApprovalCard(msg.approvalId, msg.approved);
            break;
          case 'clearMessages':
            messagesEl.innerHTML = '';
            currentTokenBlock = null;
            break;
        }
      });

      function appendMessage(m) {
        currentTokenBlock = null;
        const card = document.createElement('div');
        card.className = 'message-card';
        if (m.sender !== 'system') {
          const badge = document.createElement('span');
          badge.className = 'badge-tag';
          badge.textContent =
            m.sender === 'user_local'  ? '[Local]' :
            m.sender === 'user_remote' ? '[Remote]' : '[Agent]';
          card.appendChild(badge);
        }
        const content = document.createElement('div');
        content.style.whiteSpace = 'pre-wrap';
        content.textContent = m.content;
        card.appendChild(content);
        messagesEl.appendChild(card);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function handleStreamChunk(chunk) {
        if (chunk.type === 'token') {
          if (!currentTokenBlock) {
            currentTokenBlock = document.createElement('div');
            currentTokenBlock.className = 'message-card';
            const badge = document.createElement('span');
            badge.className = 'badge-tag';
            badge.textContent = '[Agent]';
            currentTokenBlock.appendChild(badge);
            messagesEl.appendChild(currentTokenBlock);
          }
          const span = document.createElement('span');
          span.textContent = chunk.content;
          currentTokenBlock.appendChild(span);
        } else if (chunk.type === 'thought') {
          const thought = document.createElement('div');
          thought.className = 'thought-block';
          thought.textContent = '[Thought] ' + chunk.content;
          messagesEl.appendChild(thought);
        } else if (chunk.type === 'tool_call') {
          currentTokenBlock = null;
          const tool = document.createElement('div');
          tool.className = 'tool-block';
          const meta = chunk.metadata || {};
          tool.textContent = '[Tool Call]: ' + (meta.name || 'tool') + ' ' + (meta.args ? JSON.stringify(meta.args) : '');
          messagesEl.appendChild(tool);
        } else if (chunk.type === 'tool_result') {
          currentTokenBlock = null;
          const res = document.createElement('div');
          res.className = 'tool-block';
          res.style.borderColor = 'var(--accent-green)';
          res.textContent = '[Result]: ' + chunk.content;
          messagesEl.appendChild(res);
        } else if (chunk.type === 'done') {
          currentTokenBlock = null;
        }
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function renderApprovalCard(req) {
        const card = document.createElement('div');
        card.id = 'approval-' + req.approvalId;
        card.className = 'approval-box';
        const title = document.createElement('div');
        title.className = 'approval-title';
        title.textContent = '[ACTION APPROVAL REQUIRED] (' + req.riskLevel.toUpperCase() + ')';
        card.appendChild(title);
        const toolLine = document.createElement('div');
        toolLine.innerHTML = '<strong>Tool:</strong> ' + req.toolName;
        card.appendChild(toolLine);
        const codeBlock = document.createElement('div');
        codeBlock.className = 'tool-block';
        codeBlock.textContent = req.commandOrDiff || '';
        card.appendChild(codeBlock);
        const actions = document.createElement('div');
        actions.className = 'approval-actions';
        const approveBtn = document.createElement('button');
        approveBtn.className = 'btn btn-approve';
        approveBtn.textContent = 'Approve';
        approveBtn.dataset.approve = req.approvalId;
        const denyBtn = document.createElement('button');
        denyBtn.className = 'btn btn-deny';
        denyBtn.textContent = 'Deny';
        denyBtn.dataset.deny = req.approvalId;
        actions.appendChild(approveBtn);
        actions.appendChild(denyBtn);
        card.appendChild(actions);
        messagesEl.appendChild(card);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function respondApproval(approvalId, approved) {
        vscode.postMessage({ command: 'submitApproval', approvalId: approvalId, approved: approved });
        resolveApprovalCard(approvalId, approved);
      }

      function resolveApprovalCard(approvalId, approved) {
        const el = document.getElementById('approval-' + approvalId);
        if (el) {
          el.style.borderColor = approved ? 'var(--accent-green)' : 'var(--accent-red)';
          el.innerHTML = '<div style="font-weight:bold; color:' + (approved ? 'var(--accent-green)' : 'var(--accent-red)') + '">' + (approved ? '[Approved]' : '[Denied]') + '</div>';
        }
      }
      vscode.postMessage({ command: 'ready' });
    })();
  </script>
</body>
</html>`;
  }
}
