import dotenv from "dotenv";
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

// Start if executed directly
if (process.argv[1] && process.argv[1].endsWith("index.js")) {
  bootstrap().catch((err) => {
    console.error("[Relay] Fatal error starting server:", err);
    process.exit(1);
  });
}
