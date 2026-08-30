# AirLink Workstation Harness — Windows Installer
# Usage: irm https://airlink-green.vercel.app/install.ps1 | iex

$ErrorActionPreference = "Stop"
$REPO_URL = "https://github.com/Team-Managed/AirLink.git"
$INSTALL_DIR = "$HOME\.airlink"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   AirLink — Workstation Harness          ║" -ForegroundColor Cyan
Write-Host "  ║   Remote agent control from your phone   ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check Node.js ─────────────────────────────────────────────────────────
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js 20+ is required." -ForegroundColor Red
    Write-Host "        Install it: winget install OpenJS.NodeJS.LTS" -ForegroundColor Yellow
    exit 1
}
$nodeVer = node -v
Write-Host "[OK] Node.js $nodeVer" -ForegroundColor Green

# ── 2. Check Git ──────────────────────────────────────────────────────────────
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Git is required." -ForegroundColor Red
    Write-Host "        Install it: winget install Git.Git" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Git found" -ForegroundColor Green

# ── 3. Check / install pnpm ───────────────────────────────────────────────────
if (-not (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    Write-Host "[...] Installing pnpm..." -ForegroundColor White
    npm install -g pnpm --loglevel=error | Out-Null
    Write-Host "[OK] pnpm installed" -ForegroundColor Green
} else {
    Write-Host "[OK] pnpm found" -ForegroundColor Green
}

# ── 4. Clone or update repo ───────────────────────────────────────────────────
if (Test-Path "$INSTALL_DIR\.git") {
    Write-Host "[...] Updating existing AirLink install at $INSTALL_DIR ..." -ForegroundColor White
    Set-Location $INSTALL_DIR
    git pull --ff-only origin main 2>&1 | Out-Null
} else {
    Write-Host "[...] Cloning AirLink into $INSTALL_DIR ..." -ForegroundColor White
    git clone $REPO_URL $INSTALL_DIR --depth=1 --quiet
    Set-Location $INSTALL_DIR
}
Write-Host "[OK] Source ready" -ForegroundColor Green

# ── 5. Install dependencies & build ───────────────────────────────────────────
Write-Host "[...] Installing dependencies..." -ForegroundColor White
pnpm install --frozen-lockfile --silent 2>&1 | Out-Null
Write-Host "[...] Building..." -ForegroundColor White
pnpm build --silent 2>&1 | Out-Null
Write-Host "[OK] Build complete" -ForegroundColor Green

# ── 6. Launch ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  AirLink is ready. Starting your workstation harness..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Pair your phone at:  https://airlink-green.vercel.app/pair" -ForegroundColor White
Write-Host ""

pnpm --filter @airlink/cli dev
