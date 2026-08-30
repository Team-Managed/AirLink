Read `00-product-map.md` before starting.

Create the monorepo workspace layout and the shared `@agent-remote/protocol` package. Leave relay implementation, bridge logic, and mobile screens to units 02–12.

## Implementation

1. Create the root workspace configuration:
   - Configure `pnpm-workspace.yaml` registering `apps/*` and `packages/*`.
   - Setup root `package.json` with workspace script shortcuts (`build`, `typecheck`, `lint`, `test`, `dev:relay`, `dev:cli`, `dev:mobile`) and root devDependencies (`typescript`, `vitest`, `prettier`, `eslint`).
   - Create root `tsconfig.base.json` enforcing strict typechecking (`"strict": true`), Node module resolution (`"moduleResolution": "node"`), modern ECMAScript target (`"target": "ES2022"`), and declaration map outputs.
   - Configure `.gitignore` to exclude `node_modules`, `dist`, `.expo`, `.turbo`, and environment secret files.
2. Create `packages/protocol/package.json` with package name `@agent-remote/protocol` and export mappings pointing to `src/index.ts`.
   - Declare runtime dependencies on `zod` and devDependencies on `typescript` and `vitest`.
3. Create `packages/protocol/src/contracts/events.ts` defining all shared Zod schemas and exporting co-located inferred TypeScript types:
   - `LLMProviderSchema` (`openrouter`, `anthropic`, `openai`, `custom`) and `BYOKConfigSchema` (provider, model identifier string, optional API key, optional base URL).
   - `RegisterHostSchema` and `JoinSessionSchema` enforcing exact 6-character string PINs, device names, and workspace directory paths.
   - `SessionConnectedSchema` defining session ID, device name, workspace directory, and connection status (`connected`, `disconnected`).
   - `ClientPromptSchema` defining session ID, user prompt string, and optional BYOK configuration.
   - `AgentStreamSchema` defining monotonic integer sequence ID (`seqId`), session ID, stream event type (`thought`, `token`, `tool_call`, `tool_result`, `error`, `done`), content string, and optional tool metadata (tool name, arguments, execution duration).
   - `ApprovalRequestSchema` defining sequence ID, unique approval ID string, tool name, command or diff string, risk level (`low`, `medium`, `high`), optional description, and timeout integer defaulting to 180,000ms.
   - `ApprovalResponseSchema` defining approval ID, session ID, boolean approved flag, and optional rejection reason string.
   - `ClientSyncSchema` defining session ID and non-negative integer `lastSeenSeq` for reconnection recovery.
   - `StreamBatchSchema` defining session ID and an array of `AgentStreamSchema` payloads for catch-up bursts.
4. Create `packages/protocol/src/index.ts` re-exporting all contract schemas, inferred types, and validation helper functions.
5. Create `packages/protocol/tests/protocol.test.ts` with Vitest:
   - Validate that valid payload objects parse cleanly against all event schemas.
   - Validate that invalid payloads (e.g. 5-digit PINs, negative sequence numbers, unrecognized risk levels) throw descriptive Zod validation issues.
   - Verify that default values (`timeoutMs = 180000`, `clientName = 'Mobile App'`) populate automatically upon parsing.

## Scope Limits

- Do not implement Socket.io connections, TrueForge SDK bindings, or React components in this unit.
- Do not write manual duplicate TypeScript interfaces; always use `z.infer<typeof Schema>`.
- Do not commit mock or placeholder return values in tests.
- Do not introduce runtime dependencies beyond Zod in this package.

## Notes

- All apps and packages consume contracts exclusively from `@agent-remote/protocol`.
- Package exports must remain pure JavaScript and TypeScript definitions with zero side-effects.
- Inferred types must be exported side-by-side with Zod schemas.
- Depends on: 00. Required before: 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12.

## Check When Done

- Root `pnpm install` succeeds and correctly resolves workspace packages.
- `packages/protocol` builds cleanly without TypeScript errors.
- Vitest suite `pnpm --filter @agent-remote/protocol test` passes with 100% assertions green.
