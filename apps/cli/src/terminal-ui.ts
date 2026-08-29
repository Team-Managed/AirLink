import chalk from "chalk";
import boxen from "boxen";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { AgentStream, ApprovalRequest } from "@airlink/protocol";

export interface BootBannerOptions {
  pin: string;
  relayUrl: string;
  workspacePath: string;
  model: string;
  provider?: string | undefined;
  sessionId?: string | undefined;
  hostName?: string | undefined;
}

/**
 * Formats a 6-digit PIN string with a hyphen for legibility (e.g., "834192" -> "834-192").
 */
export function formatPinDisplay(rawPin: string): string {
  const cleaned = rawPin.replace(/\D/g, "");
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return rawPin;
}

/**
 * Builds the string content for the workstation boot banner with sleek, modern CLI aesthetics.
 */
export function formatBootBannerText(options: BootBannerOptions): string {
  const pinDisplay = formatPinDisplay(options.pin);
  const rawPinDigits = options.pin.replace(/\D/g, "");
  const pairUrl = `https://airlink.dev/pair?pin=${rawPinDigits}`;
  const engineLabel =
    options.provider && options.provider !== "simulated"
      ? chalk.hex("#38bdf8")(`${options.model} (${options.provider})`)
      : chalk.hex("#a855f7")(options.model || "0x-alpha");

  const lines = [
    `${chalk.bold.hex("#38bdf8")("AirLink")} ${chalk.dim("·")} ${chalk.white("Workstation Remote")} ${chalk.dim(`(${options.hostName || "local"})`)}`,
    "",
    `  ${chalk.dim("PIN")}          ${chalk.bold.hex("#4ade80")(pinDisplay)}`,
    `  ${chalk.dim("Pair")}         ${chalk.hex("#38bdf8").underline(pairUrl)}`,
    `  ${chalk.dim("Workspace")}    ${chalk.white(options.workspacePath)}`,
    `  ${chalk.dim("Model")}        ${engineLabel}`,
    "",
    chalk.dim("Ready. Type a prompt below or /help for commands."),
  ];

  return boxen(lines.join("\n"), {
    padding: { top: 0, bottom: 0, left: 1, right: 2 },
    margin: { top: 1, bottom: 1, left: 0, right: 0 },
    borderStyle: "round",
    borderColor: "gray",
  });
}

/**
 * Renders the boot banner to stdout.
 */
export function renderBootBanner(options: BootBannerOptions): void {
  console.log(formatBootBannerText(options));
}

/**
 * Helper to parse unified diff content into formatted TUI code lines.
 */
function formatInlineDiffLines(diffText: string): string {
  const lines = diffText.split("\n").filter((l) => l.trim().length > 0);
  const formatted: string[] = [];
  let lineCounter = 33;

  for (const line of lines.slice(0, 8)) {
    if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) {
      continue;
    }
    const numStr = chalk.dim(String(lineCounter).padStart(4, " "));
    lineCounter++;

    if (line.startsWith("+")) {
      formatted.push(`    ${numStr} ${chalk.green("+")}  ${chalk.green(line.slice(1))}`);
    } else if (line.startsWith("-")) {
      formatted.push(`    ${numStr} ${chalk.red("-")}  ${chalk.red(line.slice(1))}`);
    } else {
      formatted.push(`    ${numStr}    ${chalk.dim(line.startsWith(" ") ? line.slice(1) : line)}`);
    }
  }

  return formatted.length > 0 ? "\n" + formatted.join("\n") : "";
}

/**
 * Formats an incoming stream chunk into a colorized string representation matching the authentic developer TUI.
 */
export function formatStreamChunkText(chunk: AgentStream): string {
  switch (chunk.type) {
    case "thought":
      return chalk.hex("#8b949e").italic(chunk.content);

    case "token":
      return chunk.content;

    case "tool_call": {
      const toolName = String(chunk.metadata?.["name"] || "execute_tool");
      const args = (chunk.metadata?.["args"] || {}) as Record<string, unknown>;

      if (toolName === "write_file" || toolName === "edit_file" || toolName === "patch_file") {
        const filePath = String(args["path"] || args["filePath"] || "file");
        const diffPreview = typeof args["content"] === "string" ? formatInlineDiffLines(args["content"]) : "";
        return `\n${chalk.white("•")} ${chalk.bold.white("Edited")} ${chalk.cyan(filePath)}${diffPreview}`;
      }

      if (toolName === "execute_bash" || toolName === "run_tests" || toolName === "run_lint") {
        const command = String(args["command"] || chunk.content || toolName);
        return `\n${chalk.white("•")} ${chalk.bold.white("Ran")} ${chalk.hex("#7ee787")(command)}`;
      }

      if (toolName === "get_git_diff") {
        return `\n${chalk.white("•")} ${chalk.bold.white("Ran")} ${chalk.hex("#7ee787")("git diff")}`;
      }

      if (toolName === "list_directory") {
        const p = String(args["path"] || ".");
        return `\n${chalk.white("•")} ${chalk.bold.white("Ran")} ${chalk.hex("#7ee787")(`ls ${p}`)}`;
      }

      const argsStr = chunk.metadata?.["args"] ? ` ${JSON.stringify(chunk.metadata["args"])}` : "";
      return `\n${chalk.white("•")} ${chalk.bold.white("Ran")} ${chalk.cyan(toolName)}${chalk.dim(argsStr)}`;
    }

    case "tool_result": {
      const toolName = chunk.metadata?.["name"] ? `Tool Result: ${String(chunk.metadata["name"])}` : "Result";
      return chalk.dim(`  [${toolName}] ${chunk.content}`);
    }

    case "error":
      return chalk.red.bold(`\n✖ [Error] ${chunk.content}`);

    case "done":
      return `\n\n${chalk.dim("Potential next step: Tap [Review] on phone or commit to git.")}\n`;

    default:
      return chunk.content;
  }
}

/**
 * Renders an AgentStream chunk directly to terminal stdout with real-time streaming ergonomics.
 */
export function renderStreamChunk(chunk: AgentStream): void {
  if (chunk.type === "token") {
    process.stdout.write(chunk.content);
  } else {
    console.log(formatStreamChunkText(chunk));
  }
}

/**
 * Formats approval request information for terminal display.
 */
export function formatApprovalText(request: ApprovalRequest): string {
  const riskColor =
    request.riskLevel === "high"
      ? chalk.bgRed.white.bold
      : request.riskLevel === "medium"
        ? chalk.bgYellow.black.bold
        : chalk.bgGreen.black.bold;

  const content = request.commandOrDiff;
  const timeoutSec = Math.round(request.timeoutMs / 1000);

  const lines = [
    chalk.bold.yellow("[ACTION APPROVAL REQUIRED] (Dual-Surface Gate)"),
    `Tool: ${chalk.bold.cyan(request.toolName)} | Risk Level: ${riskColor(` ${request.riskLevel.toUpperCase()} `)}`,
    `Timeout: ${chalk.dim(`${timeoutSec} seconds (auto-denies if unattended)`)}`,
    ...(request.description ? [`Description: ${chalk.dim(request.description)}`] : []),
    "",
    chalk.white(content),
  ];

  return boxen(lines.join("\n"), {
    padding: 1,
    margin: 1,
    borderStyle: "double",
    borderColor: request.riskLevel === "high" ? "red" : "yellow",
  });
}

/**
 * Prompts the workstation developer for terminal confirmation [y/N].
 */
export async function promptTerminalApproval(
  request: ApprovalRequest,
  customRl?: readline.Interface,
): Promise<boolean> {
  console.log(formatApprovalText(request));
  const rl = customRl || readline.createInterface({ input, output });

  try {
    const answer = await rl.question(chalk.bold.yellow("Approve on PC [y/N]? "));
    const trimmed = answer.trim().toLowerCase();
    return trimmed === "y" || trimmed === "yes";
  } finally {
    if (!customRl) {
      rl.close();
    }
  }
}

/**
 * Prompts for interactive local user input matching the professional developer TUI.
 */
export async function promptLocalInput(rl: readline.Interface): Promise<string> {
  const promptSymbol = chalk.hex("#38bdf8").bold("airlink > ");
  const answer = await rl.question(promptSymbol);
  return answer.trim();
}

/**
 * Formats a unified git diff with syntax color highlights.
 */
export function formatDiffText(diffText: string): string {
  const lines = diffText.split("\n");
  const colored = lines.map((line) => {
    if (line.startsWith("+++") || line.startsWith("---")) {
      return chalk.bold.white(line);
    }
    if (line.startsWith("@@")) {
      return chalk.cyan(line);
    }
    if (line.startsWith("+")) {
      return chalk.green(line);
    }
    if (line.startsWith("-")) {
      return chalk.red(line);
    }
    return chalk.dim(line);
  });
  return colored.join("\n");
}

/**
 * Formats session runtime metrics into a visual boxen card.
 */
export function formatStatsText(stats: {
  sessionId: string;
  turnCount: number;
  bufferedEvents: number;
  latestSeq: number;
  provider: string;
  activeModel: string;
  workspacePath: string;
}): string {
  const lines = [
    chalk.bold.hex("#38bdf8")("AIRLINK SESSION METRICS"),
    "",
    `  ${chalk.dim("Session PIN:")}      ${chalk.green.bold(formatPinDisplay(stats.sessionId))}`,
    `  ${chalk.dim("Turns Executed:")}   ${chalk.white.bold(stats.turnCount)}`,
    `  ${chalk.dim("Buffered Events:")}  ${chalk.cyan(stats.bufferedEvents)} / 500 in-memory`,
    `  ${chalk.dim("Latest Sequence:")}  #${chalk.yellow(stats.latestSeq)}`,
    `  ${chalk.dim("Active Provider:")}  ${chalk.hex("#a855f7")(stats.provider)} (100% Free)`,
    `  ${chalk.dim("Engine Model:")}     ${chalk.white(stats.activeModel)}`,
    `  ${chalk.dim("Workspace:")}        ${chalk.dim(stats.workspacePath)}`,
  ];

  return boxen(lines.join("\n"), {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "cyan",
  });
}

/**
 * Formats recent stream history from the Ring Buffer.
 */
export function formatHistoryText(events: AgentStream[]): string {
  if (events.length === 0) {
    return chalk.dim("No events currently recorded in session history.");
  }

  const lines = [
    chalk.bold.hex("#38bdf8")(`RECENT SESSION STREAM HISTORY (${events.length} events)`),
    "",
  ];

  for (const event of events.slice(-20)) {
    const time = new Date(event.timestamp).toLocaleTimeString();
    const typeColor =
      event.type === "thought"
        ? chalk.dim.italic
        : event.type === "token"
          ? chalk.white
          : event.type === "tool_call"
            ? chalk.yellow
            : event.type === "tool_result"
              ? chalk.green
              : chalk.cyan;

    const preview = event.content.replace(/\n/g, " ").slice(0, 70);
    lines.push(`  [#${event.seqId}] ${chalk.dim(time)} [${event.type}]: ${typeColor(preview)}`);
  }

  return lines.join("\n");
}

/**
 * Formats the list of available engine models.
 */
export function formatAvailableModelsList(): string {
  const lines = [
    chalk.bold.hex("#38bdf8")("AVAILABLE ENGINE MODELS:"),
    "",
    chalk.bold.cyan("Google Gemini (via GEMINI_API_KEY in .env):"),
    `  • ${chalk.white("gemini-2.0-flash")} (Recommended)`,
    `  • ${chalk.white("gemini-1.5-flash")}`,
    `  • ${chalk.white("gemini-2.0-flash-lite")}`,
    "",
    chalk.bold.cyan("Local TrueForge Engine (Zero configuration):"),
    `  • ${chalk.white("0x-alpha")} (Default local test harness)`,
    "",
    chalk.dim("Switch models on the fly using: /model <model_name>"),
  ];

  return lines.join("\n");
}
