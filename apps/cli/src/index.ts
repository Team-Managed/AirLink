import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import chalk from "chalk";
import dotenv from "dotenv";
import {
  SocketBridge,
  TrueForgeClient,
  TrueForgeSession,
  getGitDiff,
  runWorkspaceTests,
  runWorkspaceLint,
  fetchGitHubIssue,
  saveActiveSession,
  loadActiveSession,
} from "@agent-remote/bridge-core";
import {
  renderBootBanner,
  renderStreamChunk,
  promptTerminalApproval,
  promptLocalInput,
  formatPinDisplay,
  formatDiffText,
  formatStatsText,
  formatHistoryText,
  formatAvailableModelsList,
} from "./terminal-ui.js";

// Multi-level .env discovery (looks in current dir, monorepo root, or user home)
function loadEnvironment(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
    path.resolve(process.cwd(), "..", "..", ".env"),
    path.resolve(os.homedir(), ".agent-remote", ".env"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  }
}
loadEnvironment();

export interface CliOptions {
  relayUrl: string;
  pin: string;
  workspacePath: string;
  model: string;
  daemon: boolean;
  issueNumber?: number | undefined;
  autoPr?: boolean | undefined;
  hostName?: string | undefined;
}

/**
 * Parses CLI command line arguments.
 */
export function parseCliArgs(argv: string[]): CliOptions {
  let relayUrl = process.env["RELAY_URL"] || "http://localhost:3001";
  let pin = "";
  let workspacePath = process.env["INIT_CWD"] || process.cwd();
  let model = process.env["AGENT_MODEL"] || (process.env["GEMINI_API_KEY"] ? "gemini-2.0-flash" : "0x-alpha");
  let daemon = false;
  let issueNumber: number | undefined;
  let autoPr: boolean | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === "--relay" && i + 1 < argv.length) {
      const val = argv[++i];
      if (val) relayUrl = val;
    } else if (arg === "--pin" && i + 1 < argv.length) {
      const val = argv[++i];
      if (val) pin = val;
    } else if ((arg === "--dir" || arg === "-d") && i + 1 < argv.length) {
      const val = argv[++i];
      if (val) workspacePath = val;
    } else if (arg === "--model" && i + 1 < argv.length) {
      const val = argv[++i];
      if (val) model = val;
    } else if (arg === "--issue" && i + 1 < argv.length) {
      const val = argv[++i];
      if (val) issueNumber = parseInt(val, 10);
    } else if (arg === "--pr") {
      autoPr = true;
    } else if (arg === "--daemon") {
      daemon = true;
    }
  }

  // Retrieve existing active session or generate random 6-digit numeric PIN
  if (!pin || pin.replace(/\D/g, "").length !== 6) {
    const existing = loadActiveSession(workspacePath);
    if (existing && existing.pin) {
      pin = existing.pin;
    } else {
      pin = String(Math.floor(100000 + Math.random() * 900000));
    }
  }

  return {
    relayUrl,
    pin,
    workspacePath,
    model,
    daemon,
    issueNumber,
    autoPr,
    hostName: os.hostname(),
  };
}

/**
 * Main CLI entrypoint running the interactive workstation agent harness.
 */
export async function runCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  const options = parseCliArgs(argv);
  const sessionId = options.pin.replace(/\D/g, "");

  // Persist active session for VS Code Extension, Mobile, and Web pairing synchronization
  saveActiveSession({
    pin: options.pin,
    sessionId,
    relayUrl: options.relayUrl,
    model: options.model,
    workspacePath: options.workspacePath,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // 1. Initialize TrueForge Client & Session
  const trueForgeClient = new TrueForgeClient({ defaultModel: options.model });
  const session: TrueForgeSession = trueForgeClient.createSession({
    sessionId,
    workspacePath: options.workspacePath,
  });

  // 2. Initialize SocketBridge to Relay server
  const bridge = new SocketBridge({
    relayUrl: options.relayUrl,
    pin: options.pin,
    hostName: options.hostName || "workstation",
    workspacePath: options.workspacePath,
    autoConnect: true,
  });

  // 3. Render boot banner
  renderBootBanner({
    pin: options.pin,
    relayUrl: options.relayUrl,
    workspacePath: options.workspacePath,
    model: session.defaultModel,
    provider: session.providerConfig.provider,
    sessionId,
    hostName: options.hostName,
  });

  let activeRl: readline.Interface | null = null;
  let isExecuting = false;

  // 4. Helper to execute a turn and mirror stream to both terminal and remote socket
  async function dispatchTurn(promptText: string, origin: "local" | "remote"): Promise<void> {
    if (isExecuting) {
      console.log(chalk.yellow("\n⚠️ Agent turn already in progress. Please wait..."));
      return;
    }

    isExecuting = true;
    try {
      if (origin === "remote") {
        console.log(chalk.hex("#38bdf8").bold(`\n📱 [Remote @ Phone]: `) + chalk.white(promptText));
      }

      for await (const chunk of session.executeTurn({ prompt: promptText })) {
        renderStreamChunk(chunk);
        bridge.sendStream(chunk);
      }
    } catch (err) {
      console.error(chalk.red.bold(`\nTurn execution error:`), err);
    } finally {
      isExecuting = false;
    }
  }

  // 5. Connect bridge event listeners
  bridge.onSessionConnected((conn) => {
    console.log(
      chalk.green.bold(`\n📱 [Pairing Established] `) +
        chalk.white(`Remote client connected to session ${formatPinDisplay(conn.sessionId)}`),
    );
  });

  bridge.onPrompt((clientPrompt) => {
    void dispatchTurn(clientPrompt.prompt, "remote");
  });

  bridge.onSync((sync) => {
    const missedEvents = session.ringBuffer.getEventsSince(sync.lastSeenSeq);
    bridge.sendStreamBatch({
      sessionId,
      events: missedEvents,
    });
  });

  bridge.onHostApprovalPrompt((req) => {
    // Prompt developer on PC terminal simultaneously
    void promptTerminalApproval(req, activeRl || undefined).then((approved) => {
      bridge.approvalManager.resolveApproval(
        req.approvalId,
        approved,
        approved ? "Approved via PC Terminal" : "Denied via PC Terminal",
      );
    });
  });

  // 6. Handle process exit signals
  const cleanup = () => {
    console.log(chalk.dim("\nShutting down Agent Remote CLI..."));
    if (activeRl) {
      activeRl.close();
    }
    bridge.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // 7. If initial issue directive was provided
  if (options.issueNumber) {
    const issuePrompt = `Fix GitHub Issue #${options.issueNumber} and verify test suite passes.`;
    await dispatchTurn(issuePrompt, "local");
  }

  // 8. Start interactive REPL if not in daemon mode
  if (!options.daemon) {
    activeRl = readline.createInterface({ input, output });

    while (true) {
      try {
        const inputLine = await promptLocalInput(activeRl);
        if (!inputLine) continue;

        if (inputLine === "/exit" || inputLine === "/quit") {
          cleanup();
          break;
        }

        if (inputLine === "/help") {
          console.log(chalk.bold.hex("#38bdf8")("\n⚡ AGENT REMOTE REPL COMMAND PALETTE:"));
          console.log(`  ${chalk.cyan("/diff")}             - Show current uncommitted git diff`);
          console.log(`  ${chalk.cyan("/clear")} / ${chalk.cyan("/reset")}   - Reset conversation context and event buffer`);
          console.log(`  ${chalk.cyan("/issue <id>")}       - Import GitHub issue context directly into agent turn`);
          console.log(`  ${chalk.cyan("/model [name]")}     - Switch active LLM model or view free models registry`);
          console.log(`  ${chalk.cyan("/models")}           - List all supported 100% free AI models`);
          console.log(`  ${chalk.cyan("/test [filter]")}    - Run workspace test suite and view output`);
          console.log(`  ${chalk.cyan("/lint")}             - Run workspace linter and typecheck`);
          console.log(`  ${chalk.cyan("/stats")}            - View session metrics, buffer size, and sequence counter`);
          console.log(`  ${chalk.cyan("/history")}          - Replay recent stream events from in-memory ring buffer`);
          console.log(`  ${chalk.cyan("/pr")}               - Instruct agent to commit and create GitHub PR`);
          console.log(`  ${chalk.cyan("/pin")}              - Display active pairing PIN and URL`);
          console.log(`  ${chalk.cyan("/status")}           - Show relay connection and buffer status`);
          console.log(`  ${chalk.cyan("/exit")}             - Gracefully shut down the agent harness\n`);
          continue;
        }

        if (inputLine === "/diff") {
          console.log(chalk.dim("\nFetching workspace git diff..."));
          const diff = await getGitDiff(options.workspacePath);
          console.log(`\n${formatDiffText(diff)}\n`);
          continue;
        }

        if (inputLine === "/clear" || inputLine === "/reset") {
          session.clearHistory();
          console.log(chalk.green("\n✔ Conversation history and in-memory ring buffer reset.\n"));
          continue;
        }

        if (inputLine.startsWith("/issue")) {
          const parts = inputLine.split(" ");
          const issueNum = parts[1] ? parseInt(parts[1], 10) : NaN;
          if (isNaN(issueNum)) {
            console.log(chalk.yellow("\nUsage: /issue <issue_number> (e.g. /issue 42)\n"));
            continue;
          }
          console.log(chalk.dim(`\nFetching GitHub issue #${issueNum}...`));
          const issue = await fetchGitHubIssue(issueNum, options.workspacePath);
          console.log(chalk.bold.cyan(`\n📋 Loaded Issue: ${issue.title}`));
          console.log(chalk.dim(issue.body));
          await dispatchTurn(`Fix GitHub Issue #${issueNum} ("${issue.title}"): ${issue.body}`, "local");
          continue;
        }

        if (inputLine === "/models") {
          console.log(`\n${formatAvailableModelsList()}\n`);
          continue;
        }

        if (inputLine.startsWith("/model")) {
          const parts = inputLine.split(" ");
          const newModel = parts[1]?.trim();
          if (!newModel) {
            console.log(
              `\nActive Model: ${chalk.hex("#a855f7").bold(session.defaultModel)} [${session.providerConfig.provider} (Free)]`,
            );
            console.log(chalk.dim("To switch model, run: /model <model_name> or /models for list\n"));
            continue;
          }
          session.setModel(newModel);
          console.log(chalk.green(`\n✔ Switched active model to: ${chalk.bold(newModel)}\n`));
          continue;
        }

        if (inputLine.startsWith("/test")) {
          const filter = inputLine.slice(5).trim();
          console.log(chalk.dim(`\nRunning workspace tests ${filter ? `(filter: ${filter})` : ""}...`));
          const result = await runWorkspaceTests(options.workspacePath, filter || undefined);
          console.log(result.success ? chalk.green(`\n✔ Tests Passed (${result.durationMs}ms):`) : chalk.red(`\n❌ Tests Failed (${result.durationMs}ms):`));
          console.log(chalk.white(result.output) + "\n");
          continue;
        }

        if (inputLine === "/lint") {
          console.log(chalk.dim("\nRunning workspace lint and typecheck..."));
          const result = await runWorkspaceLint(options.workspacePath);
          console.log(result.success ? chalk.green(`\n✔ ${result.output}\n`) : chalk.red(`\n❌ ${result.output}\n`));
          continue;
        }

        if (inputLine === "/stats") {
          console.log(`\n${formatStatsText(session.getStats())}\n`);
          continue;
        }

        if (inputLine === "/history") {
          console.log(`\n${formatHistoryText(session.ringBuffer.getAllEvents())}\n`);
          continue;
        }

        if (inputLine === "/pin") {
          console.log(
            `\nActive PIN: ${chalk.green.bold(formatPinDisplay(options.pin))} | URL: ${chalk.cyan.underline(`https://agent-remote.dev/pair?pin=${sessionId}`)}\n`,
          );
          continue;
        }

        if (inputLine === "/status") {
          console.log(
            `\nRelay Connected: ${bridge.isConnected() ? chalk.green("YES") : chalk.red("NO")} | Buffered Events: ${session.ringBuffer.size} | Latest Seq: ${session.ringBuffer.latestSeq}\n`,
          );
          continue;
        }

        if (inputLine === "/pr") {
          await dispatchTurn("Create a pull request with all session changes and test results.", "local");
          continue;
        }

        // Regular user prompt
        await dispatchTurn(inputLine, "local");
      } catch {
        break;
      }
    }
  }
}
