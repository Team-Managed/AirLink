Read `00-product-map.md` before starting.
Also read `15-deployment-and-release.md`, `16-ci-workflows-and-governance.md`, `18-qodo-pr-playbook-and-track-alignment.md`, and `21-performance-budgets-and-benchmarks.md`.

Define the pre-launch release gates, smoke test protocol, staging verification, instant rollback procedures, and post-launch monitoring playbook following the `shipping-and-launch` standard.

## Implementation
1. Pre-Launch Release Gate (The 6-Point Verification):
   - **Gate 1 (Code Quality & Suppression):** `node scripts/check-suppressions.mjs` passes with 0 unapproved `@ts-ignore` or `any`-casts.
   - **Gate 2 (Typecheck & Lint):** Monorepo `pnpm typecheck` and `pnpm lint` pass with 0 errors across all 6 workspaces.
   - **Gate 3 (Test Coverage):** Vitest test suite passes with 100% assertions green and $>90\%$ coverage on core packages.
   - **Gate 4 (Build Verification):** Production builds for `@agent-remote/protocol`, `@agent-remote/bridge-core`, `@agent-remote/relay`, `@agent-remote/cli`, `@agent-remote/vscode-extension`, and `@agent-remote/web` succeed.
   - **Gate 5 (Security Scan):** Gitleaks scan confirms 0 API keys or credentials exist in repository tracking.
   - **Gate 6 (Qodo Audit):** All PRs have verified Qodo Merge review badges with zero unresolved high-risk findings.
2. Staged Deployment & Smoke Test Sequence:
   - **Stage 1 (Staging Preview):** Deploy Cloud Relay Docker container to staging environment (`relay-staging.yourdomain.com`).
   - **Stage 2 (Local Host Smoke Test):**
     - Run `pnpm dev:cli` on workstation -> verify bold banner and ASCII QR code generate.
     - Connect mobile app via 6-digit PIN -> verify `session:connected` arrives in $< 200\text{ms}$.
   - **Stage 3 (Turn Execution & HITL Approval Smoke Test):**
     - Submit prompt from mobile -> verify tokens stream in real time.
     - Trigger destructive tool call -> verify 180s approval drawer opens on phone and terminal prompt appears on PC.
     - Tap `Approve` -> verify execution resumes and completes turn.
   - **Stage 4 (Reconnection "Elevator" Smoke Test):**
     - Toggle Airplane mode on phone mid-turn -> re-enable after 10 seconds -> verify missed tokens replay automatically without loss.
3. Instant Rollback Playbook:
   - **Relay Server Rollback:** Deploy previous Docker tag via `fly deploy --image <previous_tag>` or Railway instant rollback in $< 2\text{ minutes}$.
   - **Workstation CLI Rollback:** `npm` tag rollback (`npm dist-tag add @agent-remote/cli@<previous_version> latest`).
   - **Stateless Advantage:** Zero database migrations or data schema rollbacks required (ephemeral architecture).
4. Post-Launch 1-Hour Health Protocol:
   - Monitor `GET /health` endpoint on Cloud Relay (confirm `status: 200 OK`, error rate $< 0.1\%$).
   - Monitor GitHub Issues and PR Qodo Merge alerts for any regression reports.

## Scope Limits
- Do not release production builds with failing tests or skipped typecheck steps.
- Do not deploy changes directly to production without staging smoke test verification.
- Do not maintain unmonitored feature flags past 2 weeks.

## Notes
- The pre-launch checklist ensures complete demo-day readiness for the hackathon presentation without live demo crashes.
- Ephemeral architecture guarantees instant rollbacks without persistent data corruption.
- Depends on: 00 through 21.

## Check When Done
- Pre-launch 6-point release gate passes 100%.
- Full 4-stage smoke test sequence executes cleanly end-to-end.
- Rollback playbook is validated and documented.
