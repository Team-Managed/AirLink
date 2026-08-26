Read `00-product-map.md` before starting.
Also read `01-monorepo-and-protocol-contracts.md` and `02-bridge-core-and-ring-buffer.md`.

Implement hardware-encrypted in-device API key storage using `expo-secure-store` on mobile and dynamic model routing in `packages/bridge-core`.

## Implementation
1. Create `apps/mobile/src/services/vault.ts`:
   - Implement `SecureVaultService` wrapping `expo-secure-store` on native platforms and encrypted local storage on Web.
   - Implement methods to save and retrieve API keys by provider (`openrouter`, `anthropic`, `openai`, `custom`), save the active model identifier, and export the structured `BYOKConfig` object.
2. Create `apps/mobile/src/screens/SettingsScreen.tsx`:
   - Render provider selector pills: `[OpenRouter]` (default), `[Anthropic]`, `[OpenAI]`, `[Custom]`.
   - Render model identifier text input pre-filled with sensible defaults (`0x-alpha`, `deepseek/deepseek-r1`, `claude-3-7-sonnet`).
   - Render masked password input for the API key (`secureTextEntry`) with an unmask toggle button.
   - Render optional custom base URL input for local Ollama endpoints (`http://192.168.1.50:11434/v1`).
   - Render `Save to Secure Keychain` button with instant confirmation alert.
3. Update `packages/bridge-core/src/trueforge-client.ts`:
   - Inspect the incoming `byokConfig` payload on every `client:prompt` event.
   - Dynamically instantiate the TrueForge turn with the requested model provider, model name, and API key, falling back to local PC `.env` variables if omitted.

## Scope Limits
- Never persist API keys on the cloud relay server (keys are passed in-memory per turn only).
- Do not commit real API keys to repository files.
- Do not store API keys in plaintext in unencrypted `AsyncStorage`.
- Do not expose raw API keys in client error messages or logs.

## Notes
- BYOK support gives developers total flexibility to choose between 0x Alpha on OpenRouter, DeepSeek R1, or Claude 3.7.
- Hardware keychain encryption guarantees keys cannot be extracted by malicious apps on the phone.
- Depends on: 00, 01, 02, 07. Required before: 11.

## Check When Done
- Keys saved in Settings persist across mobile app restarts.
- Prompts sent with BYOK config instantiate TrueForge turns with the specified model.
- Clearing keys from the Settings screen completely removes them from the secure keychain.
