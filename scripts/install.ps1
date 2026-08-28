# Agent Remote Installer for Windows (PowerShell)
# Usage: irm https://agent-remote.dev/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   AGENT REMOTE CLI INSTALLER (WINDOWS)   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check for Node.js
$NodePath = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $NodePath) {
    Write-Host "[ERROR] Node.js (v20+ recommended) is required to run Agent Remote." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org or run 'winget install OpenJS.NodeJS.LTS'" -ForegroundColor Yellow
    exit 1
}

$NodeVersion = node -v
Write-Host "[OK] Found Node.js: $NodeVersion" -ForegroundColor Green

# Install @agent-remote/cli globally via npm
Write-Host "Installing @agent-remote/cli globally..." -ForegroundColor White

try {
    npm install -g @agent-remote/cli --loglevel=error
    Write-Host "[OK] Successfully installed @agent-remote/cli!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start your agent harness in any repository, simply run:" -ForegroundColor Cyan
    Write-Host "   agent-remote" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[WARN] Global install requires administrator permissions or custom npm prefix." -ForegroundColor Yellow
    Write-Host "Alternatively, you can run directly without installing:" -ForegroundColor White
    Write-Host "   npx @agent-remote/cli" -ForegroundColor Green
}
