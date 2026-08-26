Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md`.

Implement the standalone Socket.io cloud relay server with IP rate limiting, 5-minute TTL room sessions, and zero-retention message routing in `apps/relay`.

## Implementation

1. Create `apps/relay/package.json` declaring dependencies on `socket.io`, `dotenv`, and `@agent-remote/protocol`, with scripts for building, running development servers, and testing.
2. Create `apps/relay/src/rate-limiter.ts`:
   - Implement an in-memory IP rate limiter tracking failed pairing attempts per client IP address.
   - Maintain an attempt count and lockout timestamp per IP.
   - If an IP accumulates 3 failed PIN submissions within a 5-minute window, lock the IP out for 5 minutes and reject subsequent attempts with a typed rate-limit error.
   - Automatically clear lockout records after the lockout duration elapses.
3. Create `apps/relay/src/room-manager.ts`:
   - Implement an ephemeral room session manager storing active pairing sessions mapped by 6-digit PIN.
   - Store host socket ID, client socket ID, device name, workspace directory path, creation timestamp, and a strict 5-minute expiration timestamp (`ttlMs = 300000`).
   - Implement methods to register a host room, look up active non-expired rooms by PIN, assign a paired client socket, and automatically clean up expired rooms.
   - Provide a helper to remove rooms immediately when the host or client socket disconnects.
4. Create `apps/relay/src/server.ts`:
   - Initialize an HTTP server and attach a Socket.io server instance with permissive CORS for cross-origin mobile and web clients.
   - Expose a `GET /health` HTTP endpoint returning a 200 OK status and the current count of active paired rooms.
   - Implement the WebSocket event router:
     - `host:register`: Parse payload with `RegisterHostSchema`, register room session, and join host socket to the PIN room.
     - `client:join`: Validate incoming IP against rate limiter; parse payload with `JoinSessionSchema`; verify PIN exists and is active; join client socket to PIN room; emit `session:connected` to both host and client. If PIN is invalid, increment failure count on rate limiter and emit `session:error`.
     - `client:prompt`: Route prompt payload to the host socket in the paired room.
     - `agent:stream`: Route stream chunks to the client socket in the paired room.
     - `agent:approval_required`: Route approval request to the client socket in the paired room.
     - `client:approval_response`: Route approval decision to the host socket in the paired room.
     - `client:sync`: Route reconnection synchronization request to the host socket.
     - `disconnect`: Purge room session from memory and emit `session:disconnected` to the remaining peer.
5. Create `apps/relay/tests/relay.test.ts` with Vitest:
   - Test host registration and client pairing across two mock sockets.
   - Test rate limiter locking out an IP address after 3 consecutive invalid PIN guesses.
   - Test bidirectional message forwarding between paired host and client sockets.

## Scope Limits

- Do not persist logs, tokens, diffs, or API keys to disk or cloud databases (stateless relay).
- Do not execute tools or perform LLM inference on the relay.
- Do not allow unauthenticated sockets to join active rooms without PIN validation.
- Do not maintain session state past the 5-minute TTL without active host pinging.

## Notes

- The relay server functions purely as an in-memory, zero-retention message router between the developer's PC and mobile device.
- Rate-limiting prevents brute-force PIN enumeration across the 1,000,000 PIN keyspace.
- Depends on: 00, 01. Required before: 05, 06, 07.

## Check When Done

- Relay boots cleanly on the configured port (`PORT=3001`).
- Two mock sockets can pair via 6-digit PIN and exchange messages.
- Rate limiter locks out bad PIN attempts after 3 failures.
- Unit tests pass with `pnpm --filter @agent-remote/relay test`.
