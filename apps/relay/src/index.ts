import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRelayServer } from "./server.js";

dotenv.config();

export * from "./rate-limiter.js";
export * from "./room-manager.js";
export * from "./server.js";

const PORT = Number(process.env.PORT || 3001);

export async function bootstrap(): Promise<void> {
  const server = createRelayServer({ port: PORT });
  const { port } = await server.start();
  console.log(`[Relay] Cloud Relay Server listening on port ${port}`);
}

// Start only if executed directly as the main script entrypoint
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  bootstrap().catch((err) => {
    console.error("[Relay] Fatal error starting server:", err);
    process.exit(1);
  });
}
