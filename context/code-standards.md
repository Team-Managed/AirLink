# Code Standards and Invariants

## 1. TypeScript & Strict Types

- `tsconfig.base.json` must enforce:
  - `strict: true`
  - `noImplicitAny: true`
  - `strictNullChecks: true`
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
- **Zero Suppression Rule:** Never use `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, or `as any`. If a type error occurs, fix the underlying model or contract.

## 2. API & Interface Design (`api-and-interface-design`)

- **Discriminated Unions for Protocol Events:**
  - All WebSocket payloads in `@agent-remote/protocol` must use discriminated unions keyed on `type` or `event`.
- **Idempotency & Deduplication Invariant:**
  - Every approval request is assigned an immutable `approvalId` (UUID).
  - Approval state transitions (`pending` -> `approved` | `rejected` | `timed_out`) are strictly atomic. Any duplicate response with the same `approvalId` is rejected with `409 Conflict` to prevent duplicate tool executions.
  - Monotonic `seqId` sequence numbers (`1..N`) govern stream events for catch-up deduplication.
- **Boundary Validation:**
  - Validate all inputs at the system boundary using Zod schemas before internal processing.
  - Keep input schemas (e.g. `ClientPromptInput`) strictly separated from response schemas (e.g. `AgentStreamEvent`).

## 3. Test-Driven Development Workflow (`test-driven-development`)

- **Red-Green-Refactor Cycle:**
  1. **Red:** Write the unit test asserting the exact expected behavior and boundary condition.
  2. **Green:** Implement the minimum clean code necessary to make the test pass.
  3. **Refactor:** Clean up structure, improve naming, and optimize performance while keeping the suite green.
- **Zero Mocking Invariant:**
  - Prefer real implementations over mocks. Never mock or stub core domain logic, state machines, or ring buffer data structures.
- **Arrange-Act-Assert (AAA):**
  - Structure all Vitest test blocks with clear Arrange, Act, and Assert phases.
  - Name tests descriptively to read like executable specifications.

## 4. 5-Layer Prompt Construction Rules

The workstation prompt builder (`packages/bridge-core/src/engine/prompt-builder.ts`) must strictly separate prompt layers:

- **Layer 1 (System / Role Definition):** Constant byte-identical string defining agent capabilities.
- **Layer 2 (Tool Definitions & Sandbox Rules):** Static schemas for MCP tools (`execute_bash`, `read_file`, `write_file`).
- **Layer 3 (Workspace Topology & Rules):** Static repository file tree and user guidelines.
- **Layer 4 (Conversation History & Turns):** Recent conversational context window.
- **Layer 5 (Current User Turn & Mobile Diff Context):** Active user prompt and pending approval results.

**Invariant:** Layers 1–3 must remain 100% byte-identical across turns to guarantee provider prefix prompt caching.

## 5. State Machine Invariants

- **Approval Timeout:** All approval Promises must reject/auto-deny after 180,000 ms.
- **Ring Buffer Size:** Strictly bounded to 500 items in memory with O(1) eviction of the oldest item.
- **Zero Retention:** The relay server must never persist data to disk.
