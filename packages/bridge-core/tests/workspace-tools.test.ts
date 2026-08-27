import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  getGitDiff,
  fetchGitHubIssue,
  resolveSafeWorkspacePath,
  listDirectory,
  readWorkspaceFile,
  writeWorkspaceFile,
  runWorkspaceTests,
  dispatchWorkspaceTool,
} from "../src/workspace-tools.js";

describe("Workspace Tools Suite", () => {
  const tempWorkspace = path.join(os.tmpdir(), "agent-remote-tools-test-" + Date.now());

  beforeEach(() => {
    if (!fs.existsSync(tempWorkspace)) {
      fs.mkdirSync(tempWorkspace, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempWorkspace)) {
      fs.rmSync(tempWorkspace, { recursive: true, force: true });
    }
  });

  it("retrieves git diff or clean working tree message", async () => {
    const diff = await getGitDiff(process.cwd());
    expect(typeof diff).toBe("string");
    expect(diff.length).toBeGreaterThan(0);
  });

  it("handles GitHub issue resolution authentically or throws clear authentication error", async () => {
    try {
      const issue = await fetchGitHubIssue(42, process.cwd());
      expect(issue).toHaveProperty("title");
      expect(issue).toHaveProperty("body");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toMatch(/Failed to fetch GitHub issue #42/i);
      expect((err as Error).message).toMatch(/gh auth login|GITHUB_TOKEN/i);
    }
  }, 15000);

  it("enforces workspace path boundary confinement and blocks directory traversal", () => {
    // 1. Valid subpaths resolve cleanly
    const safeSub = resolveSafeWorkspacePath(tempWorkspace, "src/index.ts");
    expect(safeSub).toBe(path.resolve(tempWorkspace, "src/index.ts"));

    // 2. Traversal escaping root throws Security violation
    expect(() => resolveSafeWorkspacePath(tempWorkspace, "../../.ssh/config")).toThrow(
      /Security violation/i,
    );

    // 3. Absolute path outside workspace throws Security violation
    const outsidePath = os.homedir();
    expect(() => resolveSafeWorkspacePath(tempWorkspace, outsidePath)).toThrow(
      /Security violation/i,
    );
  });

  it("performs safe write_file and read_file within workspace", async () => {
    const writeRes = await writeWorkspaceFile(
      tempWorkspace,
      "nested/test-file.txt",
      "Hello Secure Agent Remote",
    );
    expect(writeRes.success).toBe(true);

    const readContent = await readWorkspaceFile(tempWorkspace, "nested/test-file.txt");
    expect(readContent).toBe("Hello Secure Agent Remote");

    const dirListing = await listDirectory(tempWorkspace, "nested");
    expect(dirListing).toContain("test-file.txt");
  });

  it("blocks directory traversal in read, write, and list file tools", async () => {
    const writeEscape = await writeWorkspaceFile(tempWorkspace, "../../escaped.txt", "pwned");
    expect(writeEscape.success).toBe(false);
    expect(writeEscape.output).toContain("Security violation");

    const readEscape = await readWorkspaceFile(tempWorkspace, "../../.ssh/id_rsa");
    expect(readEscape).toContain("Security violation");

    const listEscape = await listDirectory(tempWorkspace, "../../../");
    expect(listEscape[0]).toContain("Security violation");
  });

  it("sanitizes test filter and blocks shell command injection", async () => {
    const injectionResult = await runWorkspaceTests(tempWorkspace, "test.ts; echo INJECTED");
    expect(injectionResult.success).toBe(false);
    expect(injectionResult.output).toContain("Security violation");
    expect(injectionResult.output).toContain("Shell metacharacters are strictly rejected");
  });

  it("dispatches write_file via workspace tool dispatcher", async () => {
    const output = await dispatchWorkspaceTool(
      "write_file",
      { path: "config.json", content: '{"status": "ok"}' },
      tempWorkspace,
    );
    expect(output).toContain("Successfully wrote");

    const content = fs.readFileSync(path.join(tempWorkspace, "config.json"), "utf-8");
    expect(content).toBe('{"status": "ok"}');
  });
});
