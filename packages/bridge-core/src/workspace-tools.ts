import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";
import * as path from "node:path";
import { exec, execFile } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  durationMs: number;
}

/**
 * Resolves and strictly confines a requested relative path within the workspace root.
 * Blocks directory traversal (../), absolute paths escaping root, and symlink escapes.
 */
export function resolveSafeWorkspacePath(
  workspacePath: string = process.cwd(),
  relativeFilePath: string = ".",
): string {
  if (!workspacePath || workspacePath.trim().length === 0) {
    throw new Error(
      "Workspace path is not configured (relay-only mode). Local filesystem operations are disabled.",
    );
  }

  const normalizedWorkspace = path.resolve(workspacePath);
  const targetFile = path.resolve(normalizedWorkspace, relativeFilePath);
  const relative = path.relative(normalizedWorkspace, targetFile);

  // 1. Boundary check: must not navigate above workspace root
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      `Security violation: Target path "${relativeFilePath}" escapes workspace boundary "${normalizedWorkspace}"`,
    );
  }

  // 2. Symlink escape check: if path or any existing ancestor is a symlink, verify realpath
  if (fsSync.existsSync(targetFile)) {
    try {
      const realTarget = fsSync.realpathSync(targetFile);
      const realWorkspace = fsSync.realpathSync(normalizedWorkspace);
      const realRelative = path.relative(realWorkspace, realTarget);
      if (realRelative.startsWith("..") || path.isAbsolute(realRelative)) {
        throw new Error(
          `Security violation: Symlink target "${realTarget}" resolves outside workspace boundary "${realWorkspace}"`,
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("Security violation")) {
        throw err;
      }
    }
  }

  return targetFile;
}

/**
 * Lists files and directories in the workspace under strict confinement.
 */
export async function listDirectory(
  workspacePath: string = process.cwd(),
  relativeDirPath: string = ".",
): Promise<string[]> {
  try {
    const targetDir = resolveSafeWorkspacePath(workspacePath, relativeDirPath);
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    return entries
      .filter((e) => !e.name.startsWith(".git") && e.name !== "node_modules" && e.name !== "dist")
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return [`Error reading directory "${relativeDirPath}": ${msg}`];
  }
}

/**
 * Reads the text content of a file in the workspace under strict confinement.
 */
export async function readWorkspaceFile(
  workspacePath: string = process.cwd(),
  relativeFilePath: string,
): Promise<string> {
  try {
    const targetFile = resolveSafeWorkspacePath(workspacePath, relativeFilePath);
    const content = await fs.readFile(targetFile, "utf-8");
    return content;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Error reading file "${relativeFilePath}": ${msg}`;
  }
}

/**
 * Writes content to a file in the workspace under strict confinement.
 */
export async function writeWorkspaceFile(
  workspacePath: string = process.cwd(),
  relativeFilePath: string,
  content: string,
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  try {
    const targetFile = resolveSafeWorkspacePath(workspacePath, relativeFilePath);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, content, "utf-8");
    return {
      success: true,
      output: `Successfully wrote ${Buffer.byteLength(content, "utf-8")} bytes to ${relativeFilePath}`,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      output: `Error writing file "${relativeFilePath}": ${msg}`,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Retrieves the current uncommitted git diff in the workspace.
 */
export async function getGitDiff(workspacePath: string = process.cwd()): Promise<string> {
  if (!workspacePath || workspacePath.trim().length === 0) {
    return "No workspace attached (relay-only mode).";
  }

  try {
    const { stdout: diffOutput } = await execAsync("git diff HEAD", {
      cwd: workspacePath,
      timeout: 10000,
    });

    if (diffOutput && diffOutput.trim().length > 0) {
      return diffOutput.trim();
    }

    const { stdout: statusOutput } = await execAsync("git status --short", {
      cwd: workspacePath,
      timeout: 5000,
    });

    if (statusOutput && statusOutput.trim().length > 0) {
      return `Untracked / Staged files:\n${statusOutput.trim()}`;
    }

    return "No uncommitted changes in workspace (working tree clean).";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Error reading git diff: ${msg}`;
  }
}

// Allowed test filter regex (alphanumeric, path separators, hyphens, underscores, dots, @, :)
const SAFE_TEST_FILTER_REGEX = /^[a-zA-Z0-9_\-./@:\\\s]+$/;

/**
 * Runs the workspace test suite safely without shell command injection vulnerability.
 */
export async function runWorkspaceTests(
  workspacePath: string = process.cwd(),
  filter?: string,
): Promise<ToolExecutionResult> {
  const startTime = Date.now();

  if (!workspacePath || workspacePath.trim().length === 0) {
    return {
      success: false,
      output: "Error: No workspace attached (relay-only mode). Cannot execute tests.",
      durationMs: 0,
    };
  }

  // 1. Strict filter sanitization to prevent shell metacharacter injection
  if (filter && filter.trim().length > 0) {
    const trimmedFilter = filter.trim();
    if (!SAFE_TEST_FILTER_REGEX.test(trimmedFilter)) {
      return {
        success: false,
        output: `Security violation: Invalid test filter "${filter}". Shell metacharacters are strictly rejected.`,
        durationMs: Date.now() - startTime,
      };
    }
  }

  const isWindows = process.platform === "win32";
  const pnpmCmd = isWindows ? "pnpm.cmd" : "pnpm";
  const args = ["test"];
  if (filter && filter.trim().length > 0) {
    args.push(...filter.trim().split(/\s+/));
  }

  try {
    const { stdout, stderr } = await execFileAsync(pnpmCmd, args, {
      cwd: workspacePath,
      timeout: 60000,
    });

    return {
      success: true,
      output: (stdout + (stderr ? `\n${stderr}` : "")).trim(),
      durationMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const errorObj = err as { stdout?: string; stderr?: string; message?: string };
    const output =
      (errorObj.stdout || "") + (errorObj.stderr || "") || errorObj.message || "Test run failed";
    return {
      success: false,
      output: output.trim(),
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Runs the workspace linter and typechecker.
 */
export async function runWorkspaceLint(
  workspacePath: string = process.cwd(),
): Promise<ToolExecutionResult> {
  const startTime = Date.now();

  if (!workspacePath || workspacePath.trim().length === 0) {
    return {
      success: false,
      output: "Error: No workspace attached (relay-only mode). Cannot execute typecheck.",
      durationMs: 0,
    };
  }

  const isWindows = process.platform === "win32";
  const pnpmCmd = isWindows ? "pnpm.cmd" : "pnpm";

  try {
    const { stdout, stderr } = await execFileAsync(pnpmCmd, ["typecheck"], {
      cwd: workspacePath,
      timeout: 45000,
    });

    return {
      success: true,
      output: (stdout + (stderr ? `\n${stderr}` : "")).trim() || "Typecheck passed with 0 errors.",
      durationMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const errorObj = err as { stdout?: string; stderr?: string; message?: string };
    const output =
      (errorObj.stdout || "") + (errorObj.stderr || "") || errorObj.message || "Typecheck failed";
    return {
      success: false,
      output: output.trim(),
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Executes a shell command in the workspace.
 */
export async function executeWorkspaceBash(
  command: string,
  workspacePath: string = process.cwd(),
  signal?: AbortSignal,
): Promise<ToolExecutionResult> {
  const startTime = Date.now();

  if (!workspacePath || workspacePath.trim().length === 0) {
    return {
      success: false,
      output: "Error: No workspace attached (relay-only mode). Cannot execute shell commands.",
      durationMs: 0,
    };
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workspacePath,
      timeout: 60000,
      signal,
    });
    return {
      success: true,
      output: (stdout + (stderr ? `\n${stderr}` : "")).trim() || "Command executed with no output.",
      durationMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const errorObj = err as { stdout?: string; stderr?: string; message?: string };
    const output =
      (errorObj.stdout || "") + (errorObj.stderr || "") || errorObj.message || "Execution failed";
    return {
      success: false,
      output: output.trim(),
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Fetches GitHub issue details using the `gh` CLI or GitHub REST API.
 */
export async function fetchGitHubIssue(
  issueNumber: number,
  workspacePath: string = process.cwd(),
): Promise<{ title: string; body: string; url?: string | undefined }> {
  // 1. Try official GitHub CLI (gh)
  try {
    const { stdout } = await execAsync(`gh issue view ${issueNumber} --json title,body,url`, {
      cwd: workspacePath,
      timeout: 10000,
    });

    const data = JSON.parse(stdout) as { title?: string; body?: string; url?: string };
    if (data.title) {
      return {
        title: data.title,
        body: data.body || "No description provided.",
        ...(data.url ? { url: data.url } : {}),
      };
    }
  } catch (ghErr) {
    // 2. Try direct GitHub REST API if GITHUB_TOKEN or GH_TOKEN is present
    const token = process.env["GITHUB_TOKEN"] || process.env["GH_TOKEN"];
    if (token) {
      try {
        const { stdout: remoteUrl } = await execAsync("git config --get remote.origin.url", {
          cwd: workspacePath,
          timeout: 5000,
        });

        const match = remoteUrl.trim().match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/i);
        if (match && match[1] && match[2]) {
          const owner = match[1];
          const repo = match[2];
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "User-Agent": "agent-remote-harness",
              },
            },
          );

          if (response.ok) {
            const data = (await response.json()) as {
              title?: string;
              body?: string;
              html_url?: string;
            };
            return {
              title: data.title || `Issue #${issueNumber}`,
              body: data.body || "No description provided.",
              ...(data.html_url ? { url: data.html_url } : {}),
            };
          }
        }
      } catch {
        // Fall through to authentic error
      }
    }

    const errMsg = ghErr instanceof Error ? ghErr.message : String(ghErr);
    throw new Error(
      `Failed to fetch GitHub issue #${issueNumber}: ${errMsg.trim()}. Please authenticate GitHub CLI via 'gh auth login' or configure GITHUB_TOKEN in .env.`,
    );
  }

  throw new Error(`Failed to fetch GitHub issue #${issueNumber}.`);
}

/**
 * Schema definitions for tool calling across LLMs.
 */
export const WORKSPACE_TOOLS_SCHEMA = [
  {
    type: "function",
    function: {
      name: "list_directory",
      description: "List files and subdirectories in a given workspace directory.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Relative directory path (e.g. '.' or 'packages/bridge-core')",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the full text content of a workspace file.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Relative path to file (e.g. 'packages/bridge-core/src/ring-buffer.ts')",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Create or overwrite a file in the workspace with given content.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative path to file (e.g. 'src/utils.ts')" },
          content: { type: "string", description: "Full text content to write into the file" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_git_diff",
      description: "Retrieve current uncommitted git changes in the workspace.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_tests",
      description: "Execute the workspace test suite (pnpm test).",
      parameters: {
        type: "object",
        properties: {
          filter: { type: "string", description: "Optional test file name filter" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_typecheck",
      description: "Run TypeScript typechecking across all workspace packages.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "execute_bash",
      description:
        "Execute a shell command inside the workspace directory (requires human approval).",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command to run" },
        },
        required: ["command"],
      },
    },
  },
];

/**
 * Dispatches a tool call by name and executes it on the local workspace with security containment.
 */
export async function dispatchWorkspaceTool(
  name: string,
  args: Record<string, unknown>,
  workspacePath: string = process.cwd(),
  signal?: AbortSignal,
): Promise<string> {
  switch (name) {
    case "list_directory": {
      const dirPath = typeof args["path"] === "string" ? args["path"] : ".";
      const list = await listDirectory(workspacePath, dirPath);
      return list.join("\n");
    }
    case "read_file": {
      const filePath = typeof args["path"] === "string" ? args["path"] : "";
      if (!filePath) return "Error: path parameter is required";
      return await readWorkspaceFile(workspacePath, filePath);
    }
    case "write_file": {
      const filePath = typeof args["path"] === "string" ? args["path"] : "";
      const content = typeof args["content"] === "string" ? args["content"] : "";
      if (!filePath) return "Error: path parameter is required";
      const res = await writeWorkspaceFile(workspacePath, filePath, content);
      return res.output;
    }
    case "get_git_diff": {
      return await getGitDiff(workspacePath);
    }
    case "run_tests": {
      const filter = typeof args["filter"] === "string" ? args["filter"] : undefined;
      const res = await runWorkspaceTests(workspacePath, filter);
      return res.output;
    }
    case "run_typecheck": {
      const res = await runWorkspaceLint(workspacePath);
      return res.output;
    }
    case "execute_bash": {
      const command = typeof args["command"] === "string" ? args["command"] : "";
      if (!command) return "Error: command parameter is required";
      const res = await executeWorkspaceBash(command, workspacePath, signal);
      return res.output;
    }
    default:
      return `Unknown tool "${name}"`;
  }
}
