Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md` through `08-mobile-streaming-and-terminal-feed.md`.

Implement the color-coded unified Git diff card, modal bottom-sheet approval drawer, and haptic feedback triggers in `apps/mobile`.

## Implementation
1. Create `apps/mobile/src/components/DiffCard.tsx`:
   - Parse unified diff strings (`@@ -x,y +a,b @@` format).
   - Render a line-by-line syntax-highlighted code container:
     - Added lines (prefixed with `+`): Green text (`#22c55e`) with subtle green tinted background (`#14532d22`).
     - Removed lines (prefixed with `-`): Red text (`#ef4444`) with subtle red tinted background (`#7f1d1d22`).
     - Context lines (prefixed with ` `): Slate text (`#94a3b8`).
   - Render file path badge at the top (e.g. `src/auth/middleware.ts`).
2. Create `apps/mobile/src/components/ApprovalDrawer.tsx`:
   - Implement an animated bottom-sheet modal that triggers whenever `activeApproval` state is non-null.
   - Render high-visibility amber alert header: `⚠️ Action Approval Required`.
   - Render tool name badge (e.g. `execute_bash` or `write_file`) and risk level tag (Green = Low, Amber = Medium, Red = High).
   - Render content body:
     - If the tool is a file patch: Render `DiffCard`.
     - If the tool is a terminal command: Render a monospaced code container with full command string.
   - Render an animated 180s countdown progress bar at the bottom.
   - Render large, thumb-friendly action buttons:
     - `Deny` (Red button `#ef4444`): Emits `client:approval_response` with `approved: false`.
     - `Approve` (Green button `#22c55e`): Emits `client:approval_response` with `approved: true`.
3. Integrate haptic feedback triggers:
   - Trigger warning haptic pulse on drawer slide-up.
   - Trigger success/error haptic pulse on button taps.

## Scope Limits
- Do not let the approval modal close on backdrop tap without an explicit decision.
- Do not hide the command or diff content behind collapsed accordions by default.
- Do not allow the user to approve after the 180s timer has expired.
- Do not modify files directly from the mobile app (all execution is delegated to the host daemon).

## Notes
- Interactive approvals give developers complete confidence to run agents remotely while away from their desks.
- Unified Git diff parsing handles multi-hunk patches cleanly with line numbers.
- Depends on: 00, 01, 07, 08. Required before: 11.

## Check When Done
- Receiving `agent:approval_required` automatically opens the bottom-sheet drawer.
- Unified Git diffs render with green and red line highlights.
- Tapping Approve or Deny dismisses the drawer and sends response over WebSocket.
- The 180s timer smoothly counts down to 0 and auto-dismisses on timeout.
