import * as fs from "node:fs/promises";
import * as path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  durationMs: number;
}

/**
 * Lists files and directories in the workspace.
 */
export async function listDirectory(
  workspacePath: string = process.cwd(),
  relativeDirPath: string = ".",
): Promise<string[]> {
  const targetDir = path.resolve(workspacePath, relativeDirPath);
  try {
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
 * Reads the text content of a file in the workspace.
 */
export async function readWorkspaceFile(
  workspacePath: string = process.cwd(),
  relativeFilePath: string,
): Promise<string> {
  const targetFile = path.resolve(workspacePath, relativeFilePath);
  try {
    const content = await fs.readFile(targetFile, "utf-8");
    return content;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Error reading file "${relativeFilePath}": ${msg}`;
  }
}

/**
 * Writes content to a file in the workspace.
 */
export async function writeWorkspaceFile(
  workspacePath: string = process.cwd(),
  relativeFilePath: string,
  content: string,
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  const targetFile = path.resolve(workspacePath, relativeFilePath);
  try {
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

/**
 * Runs the workspace test suite and captures output.
 */
export async function runWorkspaceTests(
  workspacePath: string = process.cwd(),
  filter?: string,
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  const cmd = filter ? `pnpm test ${filter}` : "pnpm test";

  try {
    const { stdout, stderr } = await execAsync(cmd, {
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
    const output = (errorObj.stdout || "") + (errorObj.stderr || "") || errorObj.message || "Test run failed";
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
export async function runWorkspaceLint(workspacePath: string = process.cwd()): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  const cmd = "pnpm typecheck";

  try {
    const { stdout, stderr } = await execAsync(cmd, {
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
    const output = (errorObj.stdout || "") + (errorObj.stderr || "") || errorObj.message || "Typecheck failed";
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
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workspacePath,
      timeout: 60000,
    });
    return {
      success: true,
      output: (stdout + (stderr ? `\n${stderr}` : "")).trim() || "Command executed with no output.",
      durationMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const errorObj = err as { stdout?: string; stderr?: string; message?: string };
    const output = (errorObj.stdout || "") + (errorObj.stderr || "") || errorObj.message || "Execution failed";
    return {
      success: false,
      output: output.trim(),
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Fetches GitHub issue details using the `gh` CLI if installed.
 */
export async function fetchGitHubIssue(
  issueNumber: number,
  workspacePath: string = process.cwd(),
): Promise<{ title: string; body: string; url?: string | undefined }> {
  try {
    const { stdout } = await execAsync(`gh issue view ${issueNumber} --json title,body,url`, {
      cwd: workspacePath,
      timeout: 10000,
    });

    const data = JSON.parse(stdout) as { title?: string; body?: string; url?: string };
    return {
      title: data.title || `Issue #${issueNumber}`,
      body: data.body || "No description provided.",
      ...(data.url ? { url: data.url } : {}),
    };
  } catch {
    return {
      title: `Issue #${issueNumber}`,
      body: `Resolve GitHub issue #${issueNumber} according to repository specifications.`,
    };
  }
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
          path: { type: "string", description: "Relative directory path (e.g. '.' or 'packages/bridge-core')" },
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
          path: { type: "string", description: "Relative path to file (e.g. 'packages/bridge-core/src/ring-buffer.ts')" },
        },
        required: ["path"],
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
      description: "Execute a shell command inside the workspace directory.",
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
 * Dispatches a tool call by name and executes it on the local workspace.
 */
export async function dispatchWorkspaceTool(
  name: string,
  args: Record<string, unknown>,
  workspacePath: string = process.cwd(),
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
      const res = await executeWorkspaceBash(command, workspacePath);
      return res.output;
    }
    default:
      return `Unknown tool "${name}"`;
  }
}
