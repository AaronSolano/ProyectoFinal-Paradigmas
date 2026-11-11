# ProfeLink - verificacion previa a la defensa (lint, unit, integracion, contenedores).
# Uso: pwsh scripts/verify-all.ps1 [-SkipContainers] [-RunE2E]
param(
  [switch]$SkipContainers,
  [switch]$RunE2E
)
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$results = New-Object System.Collections.Generic.List[object]
function Invoke-Check([string]$Name, [scriptblock]$Block) {
  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  & $Block
  $ok = ($LASTEXITCODE -eq 0)
  $results.Add([pscustomobject]@{ Check = $Name; Result = $(if ($ok) { "PASS" } else { "FAIL" }) })
}

Invoke-Check "Lint (tsc --noEmit)" { pnpm lint }
Invoke-Check "Unit tests" { pnpm test }
Invoke-Check "Integration tests (auth-service)" { pnpm --filter "@profelink/auth-service" --if-present test:e2e }
Invoke-Check "Integration tests (game-service)" { pnpm --filter "@profelink/game-service" --if-present test:e2e }

if (-not $SkipContainers) {
  Invoke-Check "docker compose config" { docker compose config -q }
  Invoke-Check "Containers running" {
    $names = "profelink-postgres", "profelink-auth-service", "profelink-game-service", "profelink-otel-collector", "profelink-grafana"
    $bad = 0
    foreach ($n in $names) {
      $state = docker inspect --format '{{.State.Running}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' $n 2>$null
      if ($state -notmatch '^true( healthy)?\s*$') { Write-Host "  $n -> $state" -ForegroundColor Red; $bad++ } else { Write-Host "  $n OK" }
    }
    if ($bad -gt 0) { cmd /c exit 1 } else { cmd /c exit 0 }
  }
  Invoke-Check "Grafana health (http://localhost:3000)" {
    try { Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/api/health" -TimeoutSec 10 | Out-Null; cmd /c exit 0 } catch { cmd /c exit 1 }
  }
}

if ($RunE2E) {
  Invoke-Check "Playwright E2E" { pnpm test:e2e }
}

Write-Host "`n=== Resumen ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize
if ($results | Where-Object { $_.Result -eq "FAIL" }) { exit 1 }
Write-Host "Todo verificado." -ForegroundColor Green
exit 0
