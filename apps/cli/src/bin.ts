#!/usr/bin/env node

import { runCli } from "./index.js";

runCli().catch((err) => {
  console.error("Agent Remote CLI crashed:", err);
  process.exit(1);
});
