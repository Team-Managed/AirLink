Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md` through `08-mobile-streaming-and-terminal-feed.md`.

Implement the end-to-end reconnection recovery protocol and session hydration state machine across mobile, relay, and bridge core.

## Implementation
1. In `apps/mobile/src/services/socket.ts`:
   - Track `lastReceivedSeqId: number` updated on every incoming `agent:stream` event.
   - On Socket.io `reconnect` or network regain:
     - Automatically emit `client:sync` with the current session ID and `lastSeenSeq`.
     - Display an inline amber status banner: *"Catching up..."*.
2. In `packages/bridge-core/src/socket-bridge.ts`:
   - Handle incoming `client:sync` event from the relay:
     - Query `ringBuffer.getEventsSince(data.lastSeenSeq)`.
     - Emit `agent:stream_batch` containing the array of missed stream payloads.
3. In `apps/mobile/src/components/TerminalFeed.tsx`:
   - Handle `agent:stream_batch` events: append all missed chunks in sequential order without duplicating already-rendered `seqId` items.
4. Create an integration test in `packages/bridge-core/tests/reconnect.test.ts`:
   - Simulate a turn emitting events with sequence IDs 1 through 10.
   - Simulate client disconnection after receiving sequence ID 4.
   - Emit `client:sync` with `lastSeenSeq: 4`.
   - Assert that the returned batch contains exactly events 5, 6, 7, 8, 9, and 10 in sequential order.

## Scope Limits
- Do not drop events if the client disconnects mid-stream.
- Do not duplicate events on the mobile feed upon batch hydration.
- Do not restart active agent turns when a client reconnects.
- Do not require database queries to perform stream replay (in-memory ring buffer owns replay).

## Notes
- Solves the mobile "Elevator Problem" without requiring persistent cloud databases.
- Ring buffer handles up to 500 queued events during extended network dropouts.
- Depends on: 00, 01, 02, 04, 07, 08. Required before: 12.

## Check When Done
- Simulating a network drop during an active turn recovers all missed tokens upon reconnect.
- Integration tests pass with `pnpm --filter @agent-remote/bridge-core test`.
- Mobile UI seamlessly renders replayed stream batches with zero duplicate keys.
