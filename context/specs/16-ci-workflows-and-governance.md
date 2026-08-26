Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md` and `context/ai-workflow-rules.md`.

Implement the comprehensive GitHub Actions CI pipeline, multi-package typechecking, automated test suites, commit suppression governance, and secret detection.

## Implementation
1. Create `.github/workflows/ci.yml`:
   - Trigger on all pull requests and pushes to `main`.
   - Configure workflow matrix:
     - Step 1: Checkout repository with full depth.
     - Step 2: Install Node.js 22 (LTS) and setup `pnpm` with global cache.
     - Step 3: Run `pnpm install --frozen-lockfile`.
     - Step 4: Run root `pnpm lint` and verify code standards.
     - Step 5: Run monorepo typecheck `pnpm typecheck` across all packages and apps (`packages/protocol`, `packages/bridge-core`, `apps/relay`, `apps/cli`, `apps/vscode-extension`, `apps/mobile`, `apps/web`).
     - Step 6: Run Vitest test suites `pnpm test -- --coverage` and ensure 100% test pass rate.
     - Step 7: Build all packages and verify zero compilation errors.
2. Create Pre-Commit & CI Suppression Governance (`scripts/check-suppressions.mjs`):
   - Mechanically scan all staged files or pull request diffs for banned suppression patterns:
     - `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `// eslint-disable`, `as any`, `--no-verify`, `SKIP_TESTS`, `.only(` in test files.
   - Fail the CI check with exit code 1 unless the flagged line includes `// APPROVED-SUPPRESSION: <reason>`.
   - Enforce that suppressed rules are never added silently.
3. Configure Branch Protection & Secret Scanning:
   - Configure `.github/workflows/secret_scan.yml` using Trufflehog or Gitleaks to block commits containing API keys, private keys, or credentials.
   - Document branch protection invariants (mandatory CI pass before merging to `main`).

## Scope Limits
- Do not disable typechecking or test steps in CI to force green builds.
- Do not modify CI workflow files to bypass failing checks without explicit approval.
- Do not permit commits with unapproved `@ts-ignore` or `any`-casting.

## Notes
- Mechanical suppression checks enforce code quality standards at commit and PR time without relying on developer memory alone.
- Multi-package typechecking guarantees type parity between protocol contracts and mobile/CLI consumers.
- Depends on: 00, 01, 02, 03, 04, 05, 06, 07. Required before: 18.

## Check When Done
- CI workflow runs and passes typecheck, lint, and tests across all monorepo workspaces.
- `check-suppressions.mjs` correctly catches unapproved `@ts-ignore` or `any`-casts and passes approved suppressions.
- Secret scanning verifies zero credentials exist in repository tracking.
