import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import * as os from "node:os";
import chalk from "chalk";
import dotenv from "dotenv";
import { SocketBridge, TrueForgeClient, TrueForgeSession } from "@agent-remote/bridge-core";
import {
  renderBootBanner,
  renderStreamChunk,
  promptTerminalApproval,
  promptLocalInput,
  formatPinDisplay,
} from "./terminal-ui.js";

dotenv.config();

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
  let workspacePath = process.cwd();
  let model = process.env["AGENT_MODEL"] || "0x-alpha";
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

  // Generate random 6-digit numeric PIN if none supplied
  if (!pin || pin.replace(/\D/g, "").length !== 6) {
    pin = String(Math.floor(100000 + Math.random() * 900000));
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
    model: options.model,
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
        } else if (inputLine === "/help") {
          console.log(chalk.bold("\nAgent Remote REPL Commands:"));
          console.log(`  ${chalk.cyan("/pin")}     - Display active pairing PIN and URL`);
          console.log(`  ${chalk.cyan("/status")}  - Show connection and ring buffer status`);
          console.log(`  ${chalk.cyan("/pr")}      - Instruct agent to commit and create GitHub PR`);
          console.log(`  ${chalk.cyan("/exit")}    - Shut down the agent harness\n`);
        } else if (inputLine === "/pin") {
          console.log(
            `\nActive PIN: ${chalk.green.bold(formatPinDisplay(options.pin))} | URL: ${chalk.cyan.underline(`https://agent-remote.dev/pair?pin=${sessionId}`)}\n`,
          );
        } else if (inputLine === "/status") {
          console.log(
            `\nRelay Connected: ${bridge.isConnected() ? chalk.green("YES") : chalk.red("NO")} | Buffered Events: ${session.ringBuffer.size} | Latest Seq: ${session.ringBuffer.latestSeq}\n`,
          );
        } else if (inputLine === "/pr") {
          await dispatchTurn("Create a pull request with all session changes and test results.", "local");
        } else {
          await dispatchTurn(inputLine, "local");
        }
      } catch {
        break;
      }
    }
  }
}
