# AirLink CLI Bundling, npm Registry & Cross-Platform Installers Design Spec

**Date:** 2026-10-09  
**Status:** Approved  
**Scope:** Standalone executable bundling for `@airlink/cli`, public npm registry publishing configuration, and unified one-line installer scripts (`install.ps1`, `install.sh`).

---

## 1. Problem Statement & Motivation

Currently, `@airlink/cli` resides in a monorepo workspace and depends on `@airlink/bridge-core` and `@airlink/protocol` via `workspace:*`. When someone tries to run `npx @airlink/cli` or install globally via `npm install -g @airlink/cli`, npm fails because:
1. Workspace packages are not bundled into a standalone executable.
2. The installation scripts (`scripts/install.ps1`, `scripts/install.sh`, `apps/web/public/install.ps1`, `apps/web/public/install.sh`) are desynchronized, with some cloning the entire git repository and running `pnpm install`, which is slow and requires dev tools (git, pnpm).

**Goal:** Provide a seamless, zero-friction developer experience:
- Running `npx @airlink/cli` starts the workstation harness instantly.
- One-line PowerShell (`irm ... | iex`) and POSIX shell (`curl ... | bash`) scripts install the binary in seconds without needing git or pnpm.
- Automated CI and local scripts exist for publishing `@airlink/cli` to the npm registry.

---

## 2. Architecture & Bundling Strategy

### 2.1 Bundler Selection (`esbuild`)
Following the successful implementation in `apps/vscode-extension/esbuild.mjs`, we use `esbuild` for `@airlink/cli`:
- **Speed:** Sub-second bundling.
- **Portability:** Bundles internal monorepo packages (`@airlink/bridge-core`, `@airlink/protocol`) and third-party dependencies (`chalk`, `boxen`, `dotenv`) into a single self-contained CommonJS Node script.
- **Output:** `apps/cli/dist/bin.cjs`.
- **Executable Banner:** `#!/usr/bin/env node` inserted at the top of the bundle.

### 2.2 CLI Package Manifest (`apps/cli/package.json`)
```json
{
  "name": "@airlink/cli",
  "version": "0.1.0",
  "description": "AirLink interactive terminal CLI host and client for remote coding agent control",
  "bin": {
    "airlink": "./dist/bin.cjs",
    "agent-remote": "./dist/bin.cjs"
  },
  "files": [
    "dist/bin.cjs",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "node esbuild.mjs",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "test": "vitest run",
    "dev": "node dist/bin.cjs"
  }
}
```

---

## 3. Unified Installer Scripts

### 3.1 Windows Installer (`scripts/install.ps1` & `apps/web/public/install.ps1`)
- **Command:** `irm https://airlink-green.vercel.app/install.ps1 | iex`
- **Execution Flow:**
  1. Checks for Node.js (`Get-Command node`). If missing, guides user to install via `winget install OpenJS.NodeJS.LTS`.
  2. Runs `npm install -g @airlink/cli --loglevel=error`.
  3. Validates executable availability and prints quickstart guidance (`airlink`).
  4. If permission errors occur (e.g. non-admin PowerShell), cleanly recommends `npx @airlink/cli`.

### 3.2 macOS / Linux Installer (`scripts/install.sh` & `apps/web/public/install.sh`)
- **Command:** `curl -fsSL https://airlink-green.vercel.app/install.sh | bash`
- **Execution Flow:**
  1. Checks for Node.js (`command -v node`). If missing, guides user to install via `nvm`.
  2. Runs `npm install -g @airlink/cli`.
  3. Validates executable availability.
  4. If permissions fail without sudo, smoothly recommends `npx @airlink/cli`.

---

## 4. npm Registry Release Pipeline

### 4.1 Local Release Script (`package.json`)
```json
"build:cli": "pnpm --filter @airlink/cli build",
"publish:cli": "pnpm build:cli && pnpm --filter @airlink/cli publish --access public --no-git-checks"
```

### 4.2 GitHub Actions Release Workflow (`.github/workflows/publish-cli.yml`)
- Trigger: Release publication (`types: [published]`) or manual workflow dispatch (`workflow_dispatch`).
- Environment: Node.js 22 + `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`.
- Steps:
  1. Checkout repository.
  2. Setup Node.js with registry URL (`https://registry.npmjs.org/`).
  3. Install pnpm and dependencies.
  4. Run typecheck & build standalone CLI bundle.
  5. Publish `@airlink/cli` to npm registry with public access.

---

## 5. Verification & Testing Plan
1. **Bundle Verification:**
   - Execute `node esbuild.mjs` inside `apps/cli`.
   - Run `node apps/cli/dist/bin.cjs --help` or `--version` in a clean environment without workspace dependencies.
2. **Pack Verification:**
   - Run `pnpm pack` inside `apps/cli` to verify tarball contains only `dist/bin.cjs` and required files, without any `workspace:*` dependency errors.
3. **Installer Verification:**
   - Verify `install.ps1` and `install.sh` syntax and logic in both `scripts/` and `apps/web/public/`.
4. **Monorepo Suite Check:**
   - Verify `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass cleanly.
