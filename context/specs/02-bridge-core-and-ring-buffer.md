Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md`.

Implement the in-memory event ring buffer, TrueForge SDK connector, and 5-layer modular prompt constructor inside `packages/bridge-core`. Leave presentation CLI and VS Code wrappers to units 05 and 06.

## Implementation
1. Create `packages/bridge-core/package.json` with name `@agent-remote/bridge-core`, referencing `@agent-remote/protocol` via workspace protocol, and depending on `@truefoundry/trueforge-sdk` and `socket.io-client`.
2. Create `packages/bridge-core/src/ring-buffer.ts`:
   - Implement a `RingBuffer` class initialized with a default maximum capacity of 500 stream events.
   - Maintain a monotonic integer sequence counter starting at sequence ID 1.
   - Implement `push()` method that assigns the next sequence ID, appends the event to the internal FIFO queue, and evicts the oldest event when capacity exceeds 500 items.
   - Implement `getEventsSince(lastSeenSeq)` method returning all events currently in the buffer where `seqId > lastSeenSeq`.
   - Implement `clear()`, `size`, and `latestSeq` getter properties.
3. Create `packages/bridge-core/src/prompt-builder.ts`:
   - Enforce the 5-layer modular prompt construction standard:
     - Layer 1 (Static System Role & Safety Invariants): Persona and strict rules against unapproved destructive actions.
     - Layer 2 (Static Few-Shot Examples): Concrete input/output pairs demonstrating tool execution and approval gates.
     - Layer 3 (Static Tool Schemas): Exact descriptions of available MCP tools (`execute_bash`, `read_file`, `write_file`, `list_directory`).
     - Layer 4 (Dynamic Workspace Context): Active file path, Git branch, and recent diff excerpts.
     - Layer 5 (Dynamic User Directive): The immediate task instruction submitted from the mobile client.
   - Ensure Layers 1–3 are completely static and byte-identical across all turns to enable LLM provider prompt caching.
4. Create `packages/bridge-core/src/trueforge-client.ts`:
   - Initialize `@truefoundry/trueforge-sdk` client targeting the local TrueForge engine port (default 8000).
   - Implement dynamic session creation accepting model configurations (OpenRouter `0x-alpha`, `deepseek-r1`, Anthropic).
   - Wrap turn streaming into an async iterable yielding typed token chunks and tool call events.
5. Create unit tests in `packages/bridge-core/tests/`:
   - `ring-buffer.test.ts`: Test inserting 600 items, verify buffer capacity bounds memory to 500 items, verify oldest 100 items were evicted, and assert that `getEventsSince(550)` returns the exact 50 missing items.
   - `prompt-builder.test.ts`: Verify that Layers 1-3 remain byte-identical across multiple distinct user directives.

## Scope Limits
- Do not write terminal formatting code (chalk/boxen) or VS Code extension APIs here.
- Do not persist ring buffer events to disk (ring buffer lives strictly in RAM).
- Do not execute unapproved destructive tool actions directly without delegating to unit 03's approval manager.
- Do not hardcode model provider endpoints in core logic.

## Notes
- The ring buffer is the foundation for solving the mobile reconnection "Elevator Problem".
- Byte-identical prefixes across Layers 1-3 are mandatory for 0x Alpha and Claude prompt caching.
- Depends on: 00, 01. Required before: 03, 05, 06.

## Check When Done
- Ring buffer bounds memory strictly to 500 items under high throughput test.
- Sequence numbers increment strictly by 1.
- Unit tests pass with `pnpm --filter @agent-remote/bridge-core test`.
