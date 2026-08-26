# Development Workflow: Spec-Driven Incremental Implementation

## 1. Approach

Build this project incrementally using a spec-driven workflow. Read `context/specs/00-product-map.md` before any other spec. Each numbered spec unit defines one implementation increment — its dependencies, scope limits, and a checklist. Always implement against the spec. Do not infer or invent behavior that is not defined.

## 2. Before Starting Any Unit

Read the following context files in order:

1. `context/project-overview.md` — product definition, goals, hackathon tracks, and scope
2. `context/architecture-context.md` — stack, deployables, system boundaries, storage model, and pipeline invariants
3. `context/ui-context.md` — tokens, dark palette, components, and layout patterns
4. `context/code-standards.md` — TypeScript, Zod, 5-layer prompt structure, and file organization
5. `context/ai-workflow-rules.md` — this file
6. `context/progress-tracker.md` — current phase, completed units, open questions, and next steps

## 3. Scoping Rules

- Work on one spec unit at a time. Each unit has a defined scope and a "Check When Done" list.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine two spec units into a single implementation step unless their dependency list explicitly permits it.
- Do not combine UI changes (`apps/mobile`) with bridge engine changes (`packages/bridge-core`) in the same step.
- Do not modify shared protocol contracts and deployable consumers in the same step without a verified intermediate build.

## 4. When To Split Work

Split an implementation step if it:

- Crosses the shared-package boundary without a verified contract first
- Combines the Relay server deployable and the Mobile client deployable
- Adds a new Socket.io event and builds UI screens in the same change
- Cannot be verified end-to-end quickly with a focused test or runtime check

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## 5. Handling Missing Requirements

- Do not invent product behavior that is not defined in the spec files or context files.
- If a requirement is ambiguous, resolve it in the relevant spec or context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.

## 6. Pipeline Invariants to Enforce

Never violate these during implementation (full list in `architecture-context.md`):

1. **Zero Mocking Invariant:** Never mock or hardcode outputs specifically to make a test pass.
2. **Single Contract Source:** `@agent-remote/protocol` is the sole source of truth for event schemas; never duplicate types manually in apps.
3. **180s Auto-Deny Invariant:** Every approval Promise must be bound to a 180s timeout that auto-denies unresponded tool actions.
4. **RAM-Only Ring Buffer:** The 500-event event ring buffer runs strictly in memory (`seq_id: 1..N`); never write unbounded stream logs to disk.
5. **Prompt Caching Invariant:** Layers 1–3 of the 5-layer prompt constructor must remain 100% byte-identical across turns.
6. **Zero-Retention Relay:** The Cloud Relay server is completely stateless; never write prompts, diffs, or API keys to cloud databases.
7. **Secret Redaction:** API keys and credentials must never appear in unmasked logs or WebSocket payloads.
8. **No Suppression:** Never add `@ts-ignore`, `@ts-expect-error`, or unapproved `eslint-disable` comments.

## 7. Keeping Docs In Sync

Update the relevant context file whenever implementation changes:

- Stack or deployable changes → `architecture-context.md`
- UI conventions or component patterns → `ui-context.md`
- Code conventions or file organization decisions → `code-standards.md`
- Feature scope changes or decisions made → `project-overview.md`
- Implementation progress → `progress-tracker.md`

Progress state in `progress-tracker.md` must reflect the actual implementation state, not the intended state.

## 8. Git Workflow, Atomic Commits & Save Points (`git-workflow-and-versioning`)

Follow strict version control hygiene on every unit:

1. **Short-Lived Feature Branches:**
   - Format: `feat/unit-XX-<name>` (e.g. `feat/unit-01-protocol-contracts`).
2. **Atomic Commits:**
   - Every commit does one logical thing with Conventional Commit types: `feat`, `fix`, `chore`, `docs`, `refactor`, `ci`, `test`.
   - Commit author strictly configured: username `tyraakj` and email `tyra191712@gmail.com`.
3. **Pre-Commit Hygiene Checklist:**
   - [ ] Staged diff verified (`git diff --staged`)
   - [ ] Zero secrets in diff (`git diff --staged | grep -i "secret\|api_key\|token"`)
   - [ ] Mechanical suppression check passes (`node scripts/check-suppressions.mjs`)
   - [ ] Monorepo typecheck passes (`pnpm typecheck`)
   - [ ] Unit tests pass with Vitest (`pnpm test`)
4. **Structured Change Summaries:**
   - After completing each task, provide a structured change report detailing:
     - `CHANGES MADE:` (Files modified/created)
     - `THINGS I DIDN'T TOUCH (intentionally):` (Scope discipline proof)
     - `POTENTIAL CONCERNS / INVARIANTS CHECK:` (Verification proof)

## 9. Before Moving To The Next Unit (Pre-Flight Gate)

1. The current unit's "Check When Done" checklist passes end to end.
2. No pipeline invariant defined in `architecture-context.md` was violated.
3. `progress-tracker.md` reflects the completed unit.
4. Monorepo builds cleanly and typecheck passes (`pnpm typecheck`).
5. Unit and integration tests pass (`pnpm test`).
