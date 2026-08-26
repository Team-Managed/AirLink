Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md`, `02-bridge-core-and-ring-buffer.md`, and `04-cloud-relay-server.md`.

Implement the structured JSON telemetry pipeline, correlation ID propagation (`sessionId`, `turnId`, `seqId`), RED/USE metrics collection, health endpoints, and secret redaction across all services following the `observability-and-instrumentation` standard.

## Implementation
1. Create Shared Telemetry Logger (`packages/bridge-core/src/telemetry/logger.ts`):
   - Implement a zero-dependency structured JSON logger with log levels: `debug`, `info`, `warn`, `error`.
   - Ensure every log event emits a single-line JSON object with standardized top-level keys:
     - `timestamp` (ISO 8601 string)
     - `level` (`debug` | `info` | `warn` | `error`)
     - `event` (stable snake_case identifier, e.g. `host_registered`, `approval_requested`, `approval_timeout`, `reconnect_synced`)
     - `sessionId`, `turnId`, `seqId` (mandatory correlation IDs)
     - `durationMs` (execution latency where applicable)
     - `error` (structured object with `name`, `message`, `stack` where applicable).
   - Implement an automated **Secret Redaction Layer** that masks detected API key patterns (`sk-...`, `Bearer ...`, session tokens) before serialization.
2. Instrument RED Metrics on Relay Server (`apps/relay/src/metrics.ts`):
   - Track **Rate**: Total WebSocket events routed per second.
   - Track **Errors**: Count of 429 rate-limit lockouts, failed PIN attempts, and disconnected rooms.
   - Track **Duration**: Pairing latency histogram and room session durations.
   - Update `GET /health` endpoint to return structured JSON diagnostics: `{ status: "ok", uptime: number, activeRooms: number, totalEventsRouted: number, rateLimitBlocks: number }`.
3. Instrument USE Metrics on Workstation Bridge (`packages/bridge-core/src/telemetry/metrics.ts`):
   - Track **Utilization / Saturation**: Current Ring Buffer occupancy (`0..500` events) and pending approvals count.
   - Track **Duration**: TrueForge turn duration p50/p95/p99, tool execution duration, and approval response latency (time from prompt to human approval).
4. Implement Correlation ID Propagation Across WebSocket Boundaries:
   - Attach `sessionId` and `turnId` to all `client:prompt`, `agent:stream`, and `agent:approval_required` payloads.
   - Allow tracing a single user prompt from the mobile UI through the relay to TrueForge tool execution in structured logs.
5. Create Telemetry Unit Tests in `packages/bridge-core/tests/telemetry.test.ts`:
   - Test that logger produces valid JSON with required correlation fields.
   - Test that API keys and bearer tokens are masked into `[REDACTED]` in JSON output.
   - Test that metrics correctly calculate buffer utilization and turn latency histograms.

## Scope Limits
- Do not log raw API keys, session tokens, or unredacted passwords in any telemetry line.
- Do not use string interpolation or prose for log output (`console.log("user did X")` is banned).
- Do not use high-cardinality values (e.g. user prompt text, full diff content) as metric label keys.
- Do not send telemetry to third-party tracking services that sell developer data.

## Notes
- Structured logs with correlation IDs enable instantaneous debugging of network drops, pairing failures, and approval timeouts.
- RED/USE metrics provide clear visibility into system health without logging sensitive code diffs.
- Depends on: 00, 01, 02, 04. Required before: 16.

## Check When Done
- All services emit structured JSON logs with stable event names and correlation IDs.
- Secret redaction reliably sanitizes sensitive tokens before logging.
- `GET /health` on the Relay server returns active metrics and room counts.
- Telemetry unit tests pass with `pnpm test`.
