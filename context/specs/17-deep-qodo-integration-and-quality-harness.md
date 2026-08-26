Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md`, `02-bridge-core-and-ring-buffer.md`, `03-approval-state-machine-and-timeouts.md`, and `17-ci-workflows-and-governance.md`.

Deeply integrate Qodo (Qodo Gen, Qodo Merge PR Agent, and Qodo Cover) across the entire codebase to maximize code quality, automated test coverage, and PR review intelligence for the WeMakeDevs Q Branch Track.

## Implementation
1. Configure Qodo Merge PR Agent Workflow (`.github/workflows/qodo_merge.yml`):
   - Set up GitHub Actions workflow using `qodo-ai/pr-agent-action@v0.22` triggered on `pull_request` (`opened`, `reopened`, `synchronize`, `ready_for_review`).
   - Configure automated actions on every PR:
     - `auto_review: "true"` — Automatically analyzes PR diffs, flags security vulnerabilities, performance regressions, and logical bugs.
     - `auto_describe: "true"` — Generates detailed PR summaries, walkthroughs, and categorized change lists.
     - `auto_improve: "true"` — Suggests commitable code improvements and inline refactors.
   - Configure interactive PR commands: `/review`, `/improve`, `/test`, `/describe`, `/ask`.
   - Inject required secrets (`OPENAI_KEY` or `QODO_API_KEY`, `GITHUB_TOKEN`).
2. Create Qodo PR Agent Configuration (`.pr_agent.toml`):
   - Configure project-specific review instructions:
     - Enforce zero-mocking invariant and 180s approval timeout rules.
     - Validate Zod schema coverage on all new WebSocket event handlers.
     - Enforce secret redaction on all outgoing log and network payloads.
     - Demand test coverage for all new state machine transitions.
   - Customize output formatting to include hackathon quality badges and risk scores.
3. Configure Qodo Gen Test Harness (`tests/qodo/`):
   - Generate exhaustive unit and component test suites using Qodo Gen for:
     - `packages/protocol`: Boundary validation on edge cases (empty strings, extreme sequence numbers, malformed JSON).
     - `packages/bridge-core`: Ring buffer boundary tests (eviction at 500 items, empty buffer slice queries), approval timeout race conditions.
     - `apps/relay`: Rate limiter IP lockout edge cases, room session expiration timers, simultaneous multi-socket pairing.
     - `apps/mobile`: DiffCard hunk parsing, ApprovalDrawer timer countdowns, and socket reconnection sync handlers.
4. Configure Qodo Cover & Quality Reporting:
   - Configure test coverage collection in Vitest (`vitest.config.ts`) reporting LCOV and HTML coverage.
   - Set coverage thresholds: minimum 90% coverage on `packages/protocol` and `packages/bridge-core`.
   - Embed dynamic Qodo test quality and review badges in the root `README.md`.

## Scope Limits
- Do not generate trivial mock tests that pass without exercising real code paths.
- Do not commit mock API keys into `.pr_agent.toml` or workflow configurations.
- Do not disable Qodo Merge review gating on pull requests.

## Notes
- Deep Qodo integration directly addresses the Hackathon "Q Branch Track" ($5,000 prize for Best Code Quality & Testing).
- Automated PR reviews with Qodo Merge ensure that all incremental units maintain clean, bug-free implementations before merging.
- Depends on: 00 through 17.

## Check When Done
- `.github/workflows/qodo_merge.yml` and `.pr_agent.toml` are configured and validated.
- Qodo Gen unit test suites cover protocol contracts, ring buffer, rate limiting, and approval timeouts with >90% coverage.
- PRs automatically receive Qodo Merge code quality reviews, descriptions, and improvement suggestions.
- Root `README.md` highlights Qodo integration architecture and quality metrics.
