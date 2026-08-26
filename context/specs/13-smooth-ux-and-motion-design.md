Read `00-product-map.md` before starting.
Also read `07-mobile-app-shell-and-pairing.md`, `08-mobile-streaming-and-terminal-feed.md`, and `09-mobile-diff-card-and-approval-drawer.md`.

Implement motion design, haptic feedback, audio cues, skeleton loaders, and micro-interactions across mobile and web surfaces for a smooth user experience.

## Implementation
1. Implement Haptic & Audio Feedback Layer (`apps/mobile/src/services/feedback.ts`):
   - Configure `expo-haptics` triggers:
     - `NotificationFeedbackType.Warning` on incoming approval request (`agent:approval_required`).
     - `ImpactFeedbackStyle.Medium` on button tap decisions (`Approve` / `Deny`).
     - `NotificationFeedbackType.Success` on successful turn completion.
     - `NotificationFeedbackType.Error` on rate-limit lockout or execution failure.
   - Add optional subtle audio chimes for approval alerts with a user toggle in Settings.
2. Implement Smooth Drawer Transitions (`apps/mobile/src/components/ApprovalDrawer.tsx`):
   - Configure spring-physics bottom sheet slide-up animation with damped rebound.
   - Animate the 180s countdown progress bar with smooth linear color gradient transition from emerald green (180s–60s) to amber (60s–20s) to crimson red (20s–0s).
   - Add pulsating glow effect to the `Approve` button when approval is high risk.
3. Implement Terminal Feed Micro-Interactions (`apps/mobile/src/components/TerminalFeed.tsx`):
   - Animated blinking cursor at the trailing edge of streaming token chunks.
   - Smooth accordion expand/collapse transitions on `tool_result` and `thought` blocks.
   - Floating "Jump to Live" pill button that animates in when the user scrolls up past 200px from the bottom, showing a badge with the count of new unread chunks.
4. Implement Skeleton Loaders & Connection State Transitions:
   - Shimmer skeleton placeholders during PIN pairing and session hydration.
   - Smooth status pill color morphing between Disconnected (Slate), Connecting (Pulsing Amber), and Paired (Glowing Emerald).
   - Reconnection toast notification: *"Connection restored. Replaying missed chunks..."* with auto-dismiss after 2.5 seconds.
5. Implement Keyboard & Clipboard Ergonomics:
   - Click-to-copy PIN feedback with brief checkmark animation.
   - Auto-advance on 6-digit PIN inputs with backspace auto-reversal.
   - Keyboard dismissal on terminal scroll.

## Scope Limits
- Do not use heavy unoptimized animation libraries that degrade frame rates below 60fps.
- Do not play intrusive audio sounds if the device is in silent/vibrate mode.
- Do not let modal animations block incoming critical error toasts.

## Notes
- Micro-animations and haptics transform the remote control from a plain utility into a delightful developer tool.
- Visual feedback on copy and pairing prevents user uncertainty.
- Depends on: 00, 07, 08, 09. Required before: 16.

## Check When Done
- Bottom sheet approval drawer animates smoothly at 60fps on mobile devices.
- Haptic pulses trigger accurately on incoming approvals and button decisions.
- Countdown bar transitions smoothly across green, amber, and red color bands.
- Shimmer skeletons render during pairing and hydration states.
