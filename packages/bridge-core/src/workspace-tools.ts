import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  durationMs: number;
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
    // If gh CLI is not configured, return structured reference
    return {
      title: `Issue #${issueNumber}`,
      body: `Resolve GitHub issue #${issueNumber} according to repository specifications.`,
    };
  }
}
