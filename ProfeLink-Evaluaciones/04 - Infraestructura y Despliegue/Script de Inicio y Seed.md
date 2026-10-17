---
title: "Script de Inicio Rápido y Carga de Datos (Seed)"
parent: "[[00 - MOC ProfeLink]]"
tags:
  - scripts
  - bash
  - powershell
  - seed
  - infraestructura
---

# 🚀 Script de Inicio Rápido y Carga de Datos (Seed)

Para garantizar la reproducibilidad inmediata exigida por el evaluador ("un solo comando para levantar todo el sistema en una máquina limpia"), se implementan dos scripts ejecutables: `start.sh` (para entornos Linux/macOS) y `start.ps1` (para Windows).

---

## 📜 1. Script para Linux/macOS (`start.sh`)

```bash
#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 Iniciando ProfeLink - Evaluaciones en Vivo"
echo "=========================================================="

# 1. Verificar existencia de .env
if [ ! -f .env ]; then
  echo "📄 No se encontró .env. Copiando desde .env.example..."
  cp .env.example .env
fi

# 2. Levantar los contenedores con Docker Compose
echo "🐳 Levantando contenedores en segundo plano..."
docker compose up -d --build

# 3. Esperar a que PostgreSQL esté listo
echo "⏳ Esperando disponibilidad de la base de datos..."
until docker compose exec -T postgres-db pg_isready -U postgres > /dev/null 2>&1; do
  sleep 2
done

# 4. Ejecutar migraciones
echo "🗄️ Aplicando migraciones de base de datos..."
docker compose exec -T auth-service npx prisma migrate deploy
docker compose exec -T game-service npx prisma migrate deploy

# 5. Ejecutar Seed de Demostración
echo "🌱 Cargando datos iniciales de prueba (Seed)..."
docker compose exec -T game-service npm run seed

echo ""
echo "=========================================================="
echo "✅ ¡Sistema listo para la evaluación!"
echo "=========================================================="
echo "🌐 Frontend Principal:     http://localhost:5173"
echo "🔌 Cliente Externo:        http://localhost:5174"
echo "🔐 Auth Service API Docs:  http://localhost:3001/reference"
echo "🎮 Game Service API Docs:  http://localhost:3002/reference"
echo "📊 Grafana Observabilidad: http://localhost:3000"
echo "=========================================================="
```

---

## 🪟 2. Script para Windows PowerShell (`start.ps1`)

```powershell
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando ProfeLink - Evaluaciones en Vivo (Windows)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Copiar .env si no existe
if (-not (Test-Path ".env")) {
    Write-Host "📄 Copiando .env.example a .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

# 2. Levantar Docker Compose
Write-Host "🐳 Levantando contenedores en Docker..." -ForegroundColor Green
docker compose up -d --build

# 3. Esperar BD
Write-Host "⏳ Verificando disponibilidad de PostgreSQL..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 4. Migraciones y Seed
Write-Host "🗄️ Ejecutando migraciones..." -ForegroundColor Green
docker compose exec -T auth-service npx prisma migrate deploy
docker compose exec -T game-service npx prisma migrate deploy

Write-Host "🌱 Cargando Seed de datos iniciales..." -ForegroundColor Green
docker compose exec -T game-service npm run seed

Write-Host "`n✅ Sistema operativo y listo para la defensa." -ForegroundColor Green
```

---

## 🌱 3. Contenido del Seed Automático (`seed.ts`)

El script de *seed* precarga un escenario listo para ser usado sin necesidad de configuraciones manuales:

1. **Usuarios de Prueba:**
   - **Profesor:** `profe@profelink.cr` / `Password123!` (Nombre: `M.S. Alex Villegas`).
   - **Estudiante 1:** `maria@profelink.cr` / `Password123!` (Nombre: `María Alumna`).
   - **Estudiante 2:** `carlos@profelink.cr` / `Password123!` (Nombre: `Carlos Estudiante`).
2. **Cuestionario de Demostración:**
   - **Título:** *"Demostración: Paradigmas de Programación (EIF400)"*
   - **Pregunta 1:** *"¿En JavaScript, `map` y `filter` mutan el arreglo original?"* $\rightarrow$ **Falso**. Imagen precargada de un diagrama funcional.
   - **Pregunta 2:** *"¿Una función pura carece de efectos secundarios?"* $\rightarrow$ **Verdadero**. Imagen precargada de una caja negra matemática.
   - **Pregunta 3:** *"¿En Clean Architecture, el Dominio depende de la base de datos?"* $\rightarrow$ **Falso**. Imagen de las capas concéntricas.

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[Docker y Compose|Servicios en Docker Compose]]
- [[06 - Entrega y Defensa/Guion de Demostracion en Clase|Uso del Script durante la Defensa]]
