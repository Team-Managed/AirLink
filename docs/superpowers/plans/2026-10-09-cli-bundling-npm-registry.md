# AirLink CLI Bundling, npm Registry & Cross-Platform Installers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bundle `@airlink/cli` into a standalone, zero-dependency executable binary using `esbuild`, configure public npm registry release scripts and GitHub Actions, and synchronize one-line installer scripts across Windows (`install.ps1`) and macOS/Linux (`install.sh`).

**Architecture:** We use `esbuild` to bundle TypeScript source files, monorepo workspace dependencies (`@airlink/bridge-core`, `@airlink/protocol`), and CLI libraries (`chalk`, `boxen`, `dotenv`) into a single self-contained CommonJS binary (`dist/bin.cjs`). The published npm package is standalone without requiring git or pnpm.

**Tech Stack:** Node.js 18+, TypeScript, esbuild, pnpm, PowerShell, Bash, GitHub Actions.

## Global Constraints

- Standalone executable must run with `node dist/bin.cjs` with zero workspace dependencies.
- Binaries mapped: `"airlink": "./dist/bin.cjs"` and `"agent-remote": "./dist/bin.cjs"`.
- One-line installer scripts must reside in both `scripts/` and `apps/web/public/`.
- No suppressions (`@ts-ignore`, `@ts-expect-error`, `as any`).
- Conventional commits with author `tyraakj <tyra191712@gmail.com>`.

---

### Task 1: Standalone Bundling with `esbuild` for `@airlink/cli`

**Files:**
- Create: `apps/cli/esbuild.mjs`
- Modify: `apps/cli/package.json`
- Test: `apps/cli/tests/cli.test.ts`

**Interfaces:**
- Produces: `apps/cli/dist/bin.cjs` executable bundle with `#!/usr/bin/env node` shebang.

- [ ] **Step 1: Add esbuild to apps/cli/package.json and configure manifest**

Update `apps/cli/package.json` to include `esbuild` in `devDependencies`, update `"build": "node esbuild.mjs"`, configure `"bin"` to point to `"./dist/bin.cjs"`, `"files": ["dist/bin.cjs", "README.md", "LICENSE"]`, and `"publishConfig": { "access": "public" }`.

- [ ] **Step 2: Create apps/cli/esbuild.mjs bundler configuration**

Create `apps/cli/esbuild.mjs` with:
```js
import { build } from "esbuild";

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: ["src/bin.ts"],
  bundle: true,
  outfile: "dist/bin.cjs",
  platform: "node",
  format: "cjs",
  target: "node18",
  banner: {
    js: "#!/usr/bin/env node",
  },
  sourcemap: true,
  minify: false,
  logLevel: "info",
};

await build(options);
```

- [ ] **Step 3: Run build and verify bundle generation**

Run: `pnpm --filter @airlink/cli build`  
Expected: `dist/bin.cjs` generated cleanly.

- [ ] **Step 4: Verify standalone CLI execution**

Run: `node apps/cli/dist/bin.cjs --help`  
Expected: Exits cleanly or renders AirLink help/options without module resolution errors.

- [ ] **Step 5: Run CLI tests**

Run: `pnpm --filter @airlink/cli test`  
Expected: All CLI tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/cli/package.json apps/cli/esbuild.mjs
git commit -m "feat(cli): bundle standalone executable using esbuild"
```

---

### Task 2: Synchronize and Modernize One-Line Installer Scripts

**Files:**
- Modify: `scripts/install.ps1`
- Modify: `apps/web/public/install.ps1`
- Modify: `scripts/install.sh`
- Modify: `apps/web/public/install.sh`

**Interfaces:**
- Produces: Fast one-line installers that install `@airlink/cli` globally via npm and provide `npx @airlink/cli` fallback.

- [ ] **Step 1: Update Windows PowerShell installer in scripts/ and apps/web/public/**

Update `scripts/install.ps1` and `apps/web/public/install.ps1` to:
- Check for Node.js 18+.
- Install `@airlink/cli` globally: `npm install -g @airlink/cli --loglevel=error`.
- Check if `airlink` command is accessible; print quickstart guidance (`airlink`).
- Handle permission failure with friendly fallback: `npx @airlink/cli`.

- [ ] **Step 2: Update macOS/Linux Bash installer in scripts/ and apps/web/public/**

Update `scripts/install.sh` and `apps/web/public/install.sh` to:
- Check for Node.js.
- Install `@airlink/cli` globally: `npm install -g @airlink/cli`.
- Check command accessibility; handle permissions with `npx @airlink/cli` recommendation.

- [ ] **Step 3: Verify script syntax**

Verify PowerShell syntax and bash script syntax.

- [ ] **Step 4: Commit**

```bash
git add scripts/install.ps1 apps/web/public/install.ps1 scripts/install.sh apps/web/public/install.sh
git commit -m "chore(install): harmonize Windows and POSIX installer scripts with npm package"
```

---

### Task 3: npm Registry Release Automation & Tarball Packaging Verification

**Files:**
- Modify: `package.json`
- Create: `.github/workflows/publish-cli.yml`

**Interfaces:**
- Produces: `pnpm publish:cli` root command and GitHub Actions workflow for publishing to registry.npmjs.org.

- [ ] **Step 1: Add root publishing scripts in package.json**

Add to `package.json`:
```json
"build:cli": "pnpm --filter @airlink/cli build",
"publish:cli": "pnpm build:cli && pnpm --filter @airlink/cli publish --access public --no-git-checks"
```

- [ ] **Step 2: Create .github/workflows/publish-cli.yml**

Configure GitHub Actions workflow triggered on release publication and manual workflow_dispatch with npm auth token.

- [ ] **Step 3: Test pack tarball verification**

Run: `pnpm --filter @airlink/cli pack`  
Expected: Creates tarball containing `dist/bin.cjs`, `README.md`, and `package.json` without any unresolvable `workspace:*` errors.

- [ ] **Step 4: Clean up tarball and commit**

```bash
git add package.json .github/workflows/publish-cli.yml
git commit -m "ci(release): add npm publish workflow and root release scripts"
```

---

### Task 4: Full Monorepo Verification & Progress Tracker

**Files:**
- Modify: `context/progress-tracker.md`

- [ ] **Step 1: Run mechanical suppression check**

Run: `node scripts/check-suppressions.mjs`  
Expected: `[SUPPRESSION CHECK PASSED]`

- [ ] **Step 2: Run linter**

Run: `pnpm lint`  
Expected: 0 errors.

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`  
Expected: 0 TypeScript errors.

- [ ] **Step 4: Run complete test suite**

Run: `pnpm test`  
Expected: All 35 test files and 239+ tests pass.

- [ ] **Step 5: Update context/progress-tracker.md and commit**

```bash
git add context/progress-tracker.md
git commit -m "docs: update progress tracker with CLI bundling and installer synchronization"
```
