Read `00-product-map.md` before starting.
Also read `02-bridge-core-and-ring-buffer.md`, `08-mobile-streaming-and-terminal-feed.md`, `12-web-landing-page-and-demo-shell.md`, and `19-observability-telemetry-and-metrics.md`.

Define the performance budgets, latency targets, memory constraints, list virtualization rules, and prompt caching optimization benchmarks following the `performance-optimization` standard.

## Implementation
1. Enforce Concrete Performance Budgets:
   - **Web Landing & Client (`apps/web`):**
     - Lighthouse Performance Score: $\ge 90$
     - Largest Contentful Paint (LCP): $\le 2.5\text{s}$ on simulated 4G
     - Interaction to Next Paint (INP): $\le 200\text{ms}$
     - Cumulative Layout Shift (CLS): $\le 0.1$
     - Initial JavaScript bundle: $< 180\text{KB}$ gzipped.
   - **Cloud Relay Server (`apps/relay`):**
     - WebSocket message routing latency: $< 15\text{ms}$ p95
     - PIN Pairing round-trip time: $< 200\text{ms}$ p95
     - Idle server memory footprint: $< 50\text{MB}$ RAM.
   - **Workstation Bridge (`packages/bridge-core`):**
     - In-memory Ring Buffer RAM footprint: strictly bounded to $< 500\text{KB}$ (500 events max).
     - Per-command log streaming cap: $2\text{MB}$ limit with automatic head/tail truncation.
     - Lifetime local session SQLite disk footprint: $< 30\text{MB}$ total with 14-day LRU auto-pruning.
2. Optimize Mobile & Web Feed Rendering:
   - Enforce virtualized list rendering (`FlatList` in React Native, virtual windowing in Web) to guarantee smooth 60fps scrolling over 1,000+ line terminal output feeds without memory bloat.
   - Use stable memoized item keys (`seqId`) to prevent unnecessary component re-renders during rapid token streaming bursts.
   - Decouple terminal auto-scroll updates from rapid character-by-character token arrivals using animation frame throttling (16ms throttle).
3. Optimize LLM Time-to-First-Token (TTFT) via Prompt Caching:
   - Ensure Layers 1–3 of `PromptBuilder` remain 100% byte-identical across consecutive turns, leveraging OpenRouter / Anthropic prefix prompt caching to reduce TTFT by $>50\%$ and cut token costs by $>75\%$.
4. Performance Verification & Regression Tests:
   - Create a synthetic load benchmark test in `packages/bridge-core/tests/performance.test.ts` verifying that pushing 1,000 events through the ring buffer executes in $< 5\text{ms}$ without memory leaks.

## Scope Limits
- Do not add complex caching layers that introduce stale state bugs during active turn streaming.
- Do not sacrifice type safety or contract validation for microsecond gains.
- Do not let bundle size grow without automated review.

## Notes
- Strict memory bounds prevent developer machines from experiencing log bloat or slowdowns during day-long agent pairing.
- Prompt caching optimization delivers instantaneous agent responses on repeated refactoring turns.
- Depends on: 00, 01, 02, 08, 12, 19. Required before: 15.

## Check When Done
- Web landing page achieves $\ge 90$ score on Lighthouse synthetic audits.
- Ring buffer benchmark confirms $< 5\text{ms}$ execution for 1,000 events.
- Mobile terminal feed scrolls smoothly at 60fps under high-frequency token bursts.
