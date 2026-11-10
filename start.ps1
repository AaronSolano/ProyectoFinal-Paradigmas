# ProfeLink — arranque Docker Compose (postgres-db, auth-service, game-service cuando exista)
$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot
Set-Location $Root

function Require-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Error "Requisito no encontrado en PATH: $Name"
    }
}

Require-Command "docker"

if ((docker compose version 2>&1 | Out-String) -and $LASTEXITCODE -ne 0) {
    Write-Error "Docker Compose v2 no disponible."
}

if (-not (Test-Path ".env")) {
    if (-not (Test-Path ".env.example")) {
        Write-Error "Falta .env.example; no se puede crear .env"
    }
    Copy-Item ".env.example" ".env"
    Write-Host "Creado .env desde .env.example"
}

Write-Host "Levantando servicios ProfeLink (Compose)..."
docker compose up -d --build
if ($LASTEXITCODE -ne 0) {
    Write-Error "docker compose up falló"
}

function Wait-ContainerHealthy {
    param(
        [string]$Name,
        [int]$TimeoutSeconds = 180
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $health = docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" $Name 2>$null
        if ($health -eq "healthy") { return $true }
        if ($health -eq "none") {
            $running = docker inspect --format "{{.State.Running}}" $Name 2>$null
            if ($running -eq "true") { return $true }
        }
        if ((Get-Date) -gt $deadline) {
            return $false
        }
        Start-Sleep -Seconds 2
    } while ($true)
}

Write-Host "Esperando PostgreSQL..."
if (-not (Wait-ContainerHealthy "profelink-postgres" 120)) {
    Write-Error "Timeout esperando postgres-db healthy"
}
Write-Host "PostgreSQL listo."

Write-Host "Esperando auth-service..."
if (-not (Wait-ContainerHealthy "profelink-auth-service" 180)) {
    Write-Error "Timeout esperando auth-service healthy"
}
Write-Host "auth-service listo (http://localhost:${env:AUTH_PORT}/reference)."

if (docker ps --format "{{.Names}}" | Select-String -Pattern "^profelink-game-service$" -Quiet) {
    Write-Host "Esperando game-service..."
    if (-not (Wait-ContainerHealthy "profelink-game-service" 180)) {
        Write-Error "Timeout esperando game-service healthy"
    }
    Write-Host "game-service listo (http://localhost:${env:GAME_PORT}/reference)."
}

Write-Host "Arranque completado."
