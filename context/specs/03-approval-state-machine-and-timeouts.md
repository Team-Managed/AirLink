Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md` and `02-bridge-core-and-ring-buffer.md`.

Implement the approval Promise resolver map, 180s auto-deny timeout state machine, and dual-surface coordination inside `packages/bridge-core`.

## Implementation

1. Create `packages/bridge-core/src/approval-handler.ts`:
   - Implement `ApprovalManager` class maintaining an in-memory Map of active approval IDs to Promise resolvers, timer handles, creation timestamps, and timeout durations.
   - Implement `requestApproval()` method:
     - Generate a unique approval ID (`appr_<timestamp>_<random>`).
     - Construct a validated `ApprovalRequestPayload` with the tool name, command or diff content, risk level, and timeout duration.
     - Return a Promise that pauses turn execution.
     - Start a 180-second `setTimeout` timer that automatically resolves the Promise to `false` (auto-deny) and removes the pending map entry if no response is received.
     - Emit the approval request payload to registered listeners (Relay socket and local host prompt).
   - Implement `resolveApproval(approvalId, approved, reason)` method:
     - Clear the timeout timer, remove the map entry, resolve the stored Promise with the boolean decision, and return `true`.
     - Return `false` gracefully if the approval ID is missing or already expired.
   - Implement `cancelAll(reason)` method resolving all in-flight pending approvals to `false` upon user prompt preemption or daemon shutdown.
2. Create `packages/bridge-core/src/socket-bridge.ts`:
   - Encapsulate the outbound `socket.io-client` connection to the Relay server with auto-reconnection.
   - Listen for `client:approval_response` and route to `approvalManager.resolveApproval()`.
   - Expose an `onHostApprovalPrompt()` callback hook enabling the CLI terminal or VS Code extension to present simultaneous local approval prompts.
3. Create `packages/bridge-core/tests/approval.test.ts`:
   - Test that calling `requestApproval()` returns a pending Promise and registers an active map entry.
   - Test calling `resolveApproval(id, true)` resolves the Promise with `true`.
   - Test calling `resolveApproval(id, false)` resolves the Promise with `false`.
   - Test that when 180 seconds elapse (using Vitest fake timers), the Promise auto-resolves with `false` and cleans up memory.
   - Test that calling `cancelAll()` resolves all pending promises to `false`.

## Scope Limits

- Do not hardcode mock responses in production paths.
- Do not throw unhandled promise rejection errors on timeout.
- Do not permit an approval window longer than 180 seconds without explicit user configuration.
- Do not let a single hung tool action block subsequent user prompts indefinitely.

## Notes

- Dual-surface coordination ensures that an approval can be resolved from either the mobile app or the local PC terminal without race conditions.
- Auto-denial on timeout prevents orphaned child processes on the host workstation.
- Depends on: 00, 01, 02. Required before: 05, 06.

## Check When Done

- Approvals resolve synchronously when an approval response arrives.
- Approvals auto-deny cleanly when timers expire without unhandled rejections.
- Unit tests pass with `pnpm --filter @agent-remote/bridge-core test`.
