#!/usr/bin/env bash
# AirLink Workstation Harness — macOS & Linux Installer
# Usage: curl -fsSL https://airlink-green.vercel.app/install.sh | bash

set -e

echo ""
echo -e "\033[1;36m  ╔══════════════════════════════════════════╗\033[0m"
echo -e "\033[1;36m  ║   AirLink — Workstation Harness          ║\033[0m"
echo -e "\033[1;36m  ║   Remote agent control from your phone   ║\033[0m"
echo -e "\033[1;36m  ╚══════════════════════════════════════════╝\033[0m"
echo ""

# ── 1. Check Node.js ─────────────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1; then
    echo -e "\033[1;31m[ERROR] Node.js (v18+ recommended) is required to run AirLink.\033[0m"
    echo -e "\033[1;33m        Install it via nvm: https://github.com/nvm-sh/nvm\033[0m"
    echo -e "\033[1;33m        Or via Homebrew:    brew install node\033[0m"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "\033[1;32m[OK] Found Node.js: ${NODE_VERSION}\033[0m"

# ── 2. Install @airlink/cli globally via npm ─────────────────────────────────
echo -e "Installing @airlink/cli globally from npm registry..."
if npm install -g @airlink/cli --loglevel=error 2>/dev/null; then
    echo -e "\033[1;32m[OK] Successfully installed @airlink/cli!\033[0m"
    echo ""
    echo -e "\033[1;36m  To launch your remote agent harness in any repository, run:\033[0m"
    echo -e "     \033[1;32mairlink\033[0m"
    echo ""
    echo -e "  Pair your phone at: https://airlink-green.vercel.app/pair"
    echo ""
else
    echo -e "\033[1;33m[WARN] Global install requires sudo or configured npm prefix.\033[0m"
    echo -e "       You can run AirLink directly without installing:"
    echo -e "       \033[1;32mnpx @airlink/cli\033[0m"
    echo ""
fi
