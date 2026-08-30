Read `00-product-map.md` before starting.
Also read `02-bridge-core-and-ring-buffer.md` and `03-approval-state-machine-and-timeouts.md`.

Implement external developer integrations, including Slack/Discord webhook alerts for pending approvals, local workstation desktop notifications, and mobile push notification scaffolding.

## Implementation

1. Create `packages/bridge-core/src/integrations/webhook-notifier.ts`:
   - Implement `WebhookNotifier` class supporting Slack and Discord incoming webhook formats.
   - When an `approval_required` event is triggered, post an interactive webhook card containing:
     - Header: `⚠️ Agent Action Approval Required`
     - Workspace directory name and host machine name
     - Tool name (e.g. `execute_bash`) and command snippet or diff excerpt
     - Deep-link action button: `[ Open Mobile Remote ]` pointing to `agent-remote://pair?pin=<PIN>`
     - Timeout notice: _"Auto-denies in 180 seconds"_.
   - When the approval is resolved (approved, denied, or timed out), post a followup resolution update thread.
2. Create `packages/bridge-core/src/integrations/desktop-notifier.ts`:
   - Implement native OS desktop notifications using `node-notifier` on Windows, macOS, and Linux.
   - Trigger desktop bubble with title _"Agent Remote: Action Approval Required"_ and sound alert when the workstation terminal is unfocused.
3. Create `packages/bridge-core/src/integrations/github-notifier.ts`:
   - Post session progress or completion summaries as comments on referenced GitHub Issues / Pull Requests when running with GitHub context.
4. Create `packages/bridge-core/src/integrations/config.ts`:
   - Load webhook endpoints from workspace `.agent-remote.json` or environment variables (`SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`, `GITHUB_TOKEN`).
   - Validate URLs with Zod and sanitize webhook payloads to redact detected API keys or secrets before transmission.
5. Implement Mobile Notification Scaffolding (`apps/mobile/src/services/notifications.ts`):
   - Configure local in-app notifications using `expo-notifications` when the app is backgrounded on the physical device.

## Scope Limits

- Do not send unredacted code diffs containing API keys or passwords to public webhook channels.
- Do not block engine execution if an external webhook request times out or returns HTTP 500.
- Do not require third-party paid notification services.

## Notes

- Webhook alerts allow developers to receive approval prompts on Slack/Discord on their watch or phone while away from their computer.
- Desktop notifications alert developers who have minimized their terminal window.
- Depends on: 00, 01, 02, 03. Required before: 16.

## Check When Done

- Triggering an approval executes local desktop notification and posts formatted message to configured webhook.
- Webhook failures do not disrupt the core approval state machine or timeout timer.
- Sensitive environment variables are automatically masked in outgoing webhook payloads.
