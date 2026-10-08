# AirLink Workstation Harness — Windows Installer (PowerShell)
# Usage: irm https://airlink-green.vercel.app/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   AirLink — Workstation Harness          ║" -ForegroundColor Cyan
Write-Host "  ║   Remote agent control from your phone   ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check Node.js ─────────────────────────────────────────────────────────
$NodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $NodeCmd) {
    Write-Host "[ERROR] Node.js (v18+ recommended) is required to run AirLink." -ForegroundColor Red
    Write-Host "        Install it via winget: winget install OpenJS.NodeJS.LTS" -ForegroundColor Yellow
    Write-Host "        Or download directly:  https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

$NodeVersion = node -v
Write-Host "[OK] Found Node.js: $NodeVersion" -ForegroundColor Green

# ── 2. Install @airlink/cli globally via npm ─────────────────────────────────
Write-Host "[...] Installing @airlink/cli globally from npm registry..." -ForegroundColor White

try {
    npm install -g @airlink/cli --loglevel=error
    if ($LASTEXITCODE -ne 0) {
        throw "npm install exited with code $LASTEXITCODE"
    }
    Write-Host "[OK] Successfully installed @airlink/cli!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  To launch your remote agent harness in any repository, run:" -ForegroundColor Cyan
    Write-Host "     airlink" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Pair your phone at: https://airlink-green.vercel.app/pair" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[WARN] Global install encountered permission restrictions." -ForegroundColor Yellow
    Write-Host "       You can run AirLink directly without installing:" -ForegroundColor White
    Write-Host "       npx @airlink/cli" -ForegroundColor Green
    Write-Host ""
}
