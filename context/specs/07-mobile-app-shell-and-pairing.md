Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md` and `04-cloud-relay-server.md`.

Scaffold the React Native Expo mobile application shell and build the PIN Pairing screen with socket client service in `apps/mobile`.

## Implementation

1. Create `apps/mobile/package.json` with Expo SDK 51+, React Native, `socket.io-client`, `expo-secure-store`, and `@agent-remote/protocol`.
2. Create `apps/mobile/src/theme.ts`:
   - Define the developer dark mode semantic tokens:
     - Background Base: `#090d16` (Deep obsidian navy)
     - Card / Surface: `#0f172a` (Slate 900)
     - Border & Dividers: `#1e293b` (Slate 800)
     - Primary Accent: `#38bdf8` (Electric Sky Blue)
     - Success: `#22c55e` (Emerald Green)
     - Danger: `#ef4444` (Crimson Red)
     - Warning: `#f59e0b` (Amber Yellow)
     - Text Primary: `#f8fafc` (Slate 50)
     - Text Muted: `#94a3b8` (Slate 400)
3. Create `apps/mobile/src/services/socket.ts`:
   - Implement `MobileSocketService` singleton managing the Socket.io connection to the Relay server.
   - Implement methods:
     - `connect(relayUrl)`: Initializes socket with reconnection backoff and error handlers.
     - `join(pin)`: Emits `client:join` with validated 6-digit PIN payload.
     - `sendPrompt(prompt, byok)`: Emits `client:prompt` payload.
     - `sendApproval(approvalId, approved)`: Emits `client:approval_response` payload.
     - `sync(lastSeq)`: Emits `client:sync` payload upon reconnection.
   - Expose event subscription callbacks for `session:connected`, `agent:stream`, `agent:approval_required`, and `disconnect`.
4. Create `apps/mobile/src/screens/PairingScreen.tsx`:
   - Render minimalist wordmark and pulsing connection status indicator dot.
   - Render centered 6-digit numeric input with auto-focus, large 32px typography, and monospace letter tracking.
   - Implement auto-submission when the 6th digit is entered.
   - Render `Connect to PC` primary action button with loading spinner state.
   - Render inline crimson error banner for invalid PINs or rate-limited lockouts.
   - Render top-right shortcut to open the BYOK Settings modal.
5. Create `apps/mobile/src/App.tsx`:
   - Manage top-level state switching between `PairingScreen` (when disconnected) and `SessionScreen` (when paired).
   - Wrap application with `SafeAreaProvider`.

## Scope Limits

- Do not require physical camera permissions for pairing (PIN input is the universal primary flow).
- Do not store unencrypted API keys in local storage.
- Do not connect to third-party tracking or analytics endpoints from the mobile app.
- Do not persist pairing PINs in permanent device storage across full app terminations.

## Notes

- Pairing is ephemeral and valid for the lifetime of the active local PC daemon session.
- Dark theme tokens adhere to high-density IDE aesthetics defined in `context/ui-context.md`.
- Depends on: 00, 01, 04. Required before: 08, 09, 10, 11.

## Check When Done

- Mobile app launches in Expo Web and mobile simulators (`pnpm --filter @agent-remote/mobile dev`).
- Entering 6-digit PIN emits `client:join` and transitions to paired state upon server acknowledgment.
- Invalid PINs surface immediate inline error banners without crashing the UI.
