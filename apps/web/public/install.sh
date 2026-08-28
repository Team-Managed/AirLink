#!/usr/bin/env bash
# Agent Remote Installer for macOS & Linux
# Usage: curl -fsSL https://agent-remote.dev/install.sh | bash

set -e

echo ""
echo -e "\033[1;36m================================================\033[0m"
echo -e "\033[1;36m   AGENT REMOTE CLI INSTALLER (MACOS/LINUX)   \033[0m"
echo -e "\033[1;36m================================================\033[0m"
echo ""

# Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo -e "\033[1;31m[ERROR] Node.js (v20+ recommended) is required to run Agent Remote.\033[0m"
    echo -e "\033[1;33mPlease install Node.js via nvm (https://github.com/nvm-sh/nvm) or your package manager.\033[0m"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "\033[1;32m[OK] Found Node.js: ${NODE_VERSION}\033[0m"

# Install @agent-remote/cli globally
echo -e "Installing @agent-remote/cli..."
if npm install -g @agent-remote/cli --loglevel=error 2>/dev/null; then
    echo -e "\033[1;32m[OK] Successfully installed @agent-remote/cli!\033[0m"
    echo ""
    echo -e "\033[1;36mTo start your agent harness in any repository, simply run:\033[0m"
    echo -e "   \033[1;32magent-remote\033[0m"
    echo ""
else
    echo -e "\033[1;33m[WARN] Standard npm global install requires root/sudo or configured npm prefix.\033[0m"
    echo -e "Alternatively, you can run directly without installing:"
    echo -e "   \033[1;32mnpx @agent-remote/cli\033[0m"
fi
