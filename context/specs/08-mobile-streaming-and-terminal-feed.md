Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md` and `07-mobile-app-shell-and-pairing.md`.

Implement the real-time virtualized streaming terminal feed, token chunks, thought blocks, and prompt input bar in `apps/mobile`.

## Implementation
1. Create `apps/mobile/src/components/TerminalFeed.tsx`:
   - Implement a virtualized `FlatList` component rendering stream items efficiently:
     - `thought`: Render italicized muted slate text (`#94a3b8`) inside a subtle card border (`#1e293b`).
     - `token`: Render monospaced streaming text blocks with markdown formatting support.
     - `tool_call`: Render dark code container with tool name badge (`#38bdf8`) and command snippet.
     - `tool_result`: Render collapsible success container with green checkmark (`#22c55e`) and execution duration badge.
     - `error`: Render high-contrast crimson alert card (`#ef4444`).
   - Implement auto-scroll to bottom behavior on incoming stream chunks, with user-initiated scroll detection that temporarily locks auto-scroll when reading earlier logs.
2. Create `apps/mobile/src/components/PromptInputBar.tsx`:
   - Render a full-width text input container with placeholder *"Ask agent to build, refactor, or fix..."*.
   - Render horizontal scrollable quick-action pills above the input (`[🧪 Run Tests]`, `[🔍 Git Status]`, `[🧹 Fix Lint]`, `[⚡ Rollback]`).
   - Render circular submit button with active color highlight when text is present.
3. Create `apps/mobile/src/screens/SessionScreen.tsx`:
   - Render top sticky status header showing host device name, green live connection dot, active model chip (`0x-alpha`), and disconnect button.
   - Embed `TerminalFeed` in the scrollable body and position `PromptInputBar` sticky at the bottom.
   - Hook socket stream events to append incoming chunks in real-time.

## Scope Limits
- Do not let long stream feeds cause memory leaks (use virtualized list rendering).
- Do not block the UI thread during rapid token streaming bursts.
- Do not truncate thought blocks without user toggle affordance.
- Do not clear the terminal feed on momentary WebSocket reconnections.

## Notes
- Virtualized rendering ensures smooth 60fps scrolling even over 1,000+ line terminal outputs.
- Sub-50ms latency is maintained by streaming chunks directly over WebSocket without intermediate polling.
- Depends on: 00, 01, 07. Required before: 09, 11.

## Check When Done
- Submitting a prompt on mobile streams tokens and tool events in real time with <50ms latency.
- Terminal feed renders distinct card styles for thoughts, tokens, and tool results.
- Auto-scroll locks smoothly when the user manually scrolls up to review prior history.
