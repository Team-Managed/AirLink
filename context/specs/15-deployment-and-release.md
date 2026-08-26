Read `00-product-map.md` before starting.
Also read `04-cloud-relay-server.md` and `13-web-landing-page-and-demo-shell.md`.

Define the end-to-end production deployment architecture, Docker containerization, cloud hosting on free/hobby tiers, EAS mobile builds, and npm package release workflows.

## Implementation

1. Containerize the Cloud Relay Server (`apps/relay/Dockerfile`):
   - Multi-stage Docker build with Node.js 22 (LTS) Alpine.
   - Install dependencies with `pnpm`, build TypeScript output into `/dist`, and run with non-root node user.
   - Expose port `3001` and define health check instruction hitting `GET /health`.
   - Create deployment configuration for Fly.io (`fly.toml`) or Railway / Render with always-on zero-sleep execution.
2. Configure Web Landing Page Deployment (`apps/web`):
   - Configure Vercel (or Cloudflare Pages) hosting for the Next.js landing page and web pairing client.
   - Configure environment variables (`NEXT_PUBLIC_RELAY_URL=https://relay.yourdomain.com`).
   - Enable automatic SSL/TLS termination and Edge CDN caching for static assets.
3. Configure Mobile Client Builds (`apps/mobile/eas.json`):
   - Configure Expo Application Services (EAS) build profiles for `development`, `preview` (APK / TestFlight), and `production`.
   - Configure Expo Web export script (`pnpm --filter @agent-remote/mobile export:web`) for zero-install browser pairing.
4. Configure Workstation CLI Distribution (`apps/cli`):
   - Configure `package.json` release scripts with `tsup` bundler to produce a single self-contained executable binary for `npx agent-remote`.
   - Provide installation instructions in root `README.md` (`npx @agent-remote/cli` or `pnpm dlx @agent-remote/cli`).
5. Configure Environment Variables Matrix in `context/architecture-context.md` and `.env.example`:
   - Document all required and optional environment variables across Relay, CLI, Web, and Mobile.

## Scope Limits

- Do not require paid cloud databases or custom Kubernetes clusters.
- Do not hardcode production URLs in source code; use environment variable injection.
- Do not commit production credentials, signing keys, or keystore files to git.

## Notes

- The Relay server is stateless and lightweight (<50MB RAM footprint), fitting cleanly on free tiers (Fly.io, Render, Railway).
- The web landing page deploys instantly on Vercel Hobby.
- Depends on: 00, 04, 05, 07, 13. Required before: 17, 18.

## Check When Done

- Relay Docker image builds successfully and passes container health checks.
- Web landing page builds cleanly with static asset optimization.
- CLI package bundles into a standalone executable.
- Environment variables are validated on startup with descriptive error messages on misconfiguration.
