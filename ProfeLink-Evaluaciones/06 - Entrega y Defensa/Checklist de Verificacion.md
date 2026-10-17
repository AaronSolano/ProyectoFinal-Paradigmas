---
title: "Checklist de Verificación para la Defensa (40 pts / 30%)"
parent: "[[00 - MOC ProfeLink]]"
course: "EIF400 - Paradigmas de Programación"
professor: "M.S. Alex Villegas Carranza"
tags:
  - checklist
  - rubrica
  - defensa
  - evaluacion
---

# ✅ Checklist de Verificación para la Defensa

Este checklist resume todos los criterios obligatorios y técnicos exigidos para la evaluación presencial del proyecto final (valor: **40 puntos / 30%**). Usar esta lista como control previo a la presentación en clase.

---

## 🏛️ 1. Arquitectura y Seguridad (Servicios Autónomos)
- [ ] **Desacoplamiento de Servicios:** `auth-service` y `game-service` se ejecutan en puertos separados (`3001` y `3002`) en contenedores independientes.
- [ ] **Claim `aud` en JWT:** El token emitido por `auth-service` contiene `"aud": "profelink-game-api"`.
- [ ] **Validación en Game Service:** `game-service` rechaza cualquier llamada HTTP o conexión de WebSocket si el token no contiene la audiencia requerida.
- [ ] **Arquitectura en Layers:** Organización en capas jerárquicas (Presentación, Servicios/Negocio y Persistencia/Datos) en NestJS.

---

## 🎮 2. Funcionalidades del Juego en Tiempo Real
- [ ] **CRUD de Cuestionarios:** El profesor puede crear, editar, listar y eliminar quizzes.
- [ ] **Soporte Multimedia:** Preguntas con enunciados y soporte de imágenes cargadas en el volumen persistente (`/app/uploads`).
- [ ] **Creación de Sala:** Generación de PIN único de 6 caracteres y estado `WAITING`.
- [ ] **Lobby en Vivo:** Lista de estudiantes conectados actualizándose en tiempo real mediante `room:participant_joined`.
- [ ] **Aislamiento de Salas:** Dos salas simultáneas no mezclan participantes, preguntas ni eventos.
- [ ] **Pregunta Oculta:** `game:question_opened` emite la pregunta **sin** revelar `correctAnswer`.
- [ ] **Botones V/F:** Interfaz del jugador con botones claros de Verdadero y Falso.
- [ ] **Temporizador en Servidor:** Validación estricta de que $\text{now} \le \text{expiresAt}$.
- [ ] **Anti-Doble Votación:** Intentos reiterados de respuesta en la misma pregunta son descartados/rechazados.
- [ ] **Reconexión Transparente:** Un participante que recarga su navegador no se duplica en la lista y recupera su puntaje y vista de ronda vía `room:state_sync`.
- [ ] **Revelación y Podio:** Al cerrar la pregunta se muestra la respuesta correcta y al terminar el juego se proyecta el podio final.

---

## 🔌 3. Consumo Externo e Integración de Terceros
- [ ] **Documentación Scalar:** Ambas APIs accesibles y probadas en `/reference`.
- [ ] **Cliente Externo Operativo:** Aplicación `external-consumer` en puerto `5174` autenticando con `auth-service` y consultando resultados en `game-service`.

---

## 🐳 4. Infraestructura, Reproducibilidad y Persistencia
- [ ] **Arranque en Un Solo Comando:** `./start.sh` (o `start.ps1`) levanta contenedores, corre migraciones y ejecuta el seed.
- [ ] **Datos Semilla (Seed):** Usuarios de prueba (`profe@profelink.cr`, alumnos) y cuestionario de demostración precargados.
- [ ] **Persistencia en Volúmenes:** Datos intactos tras ejecutar `docker compose restart`.
- [ ] **Observabilidad Activa:** Métricas y trazas llegando a Grafana (`http://localhost:3000`).

---

## 🧪 5. Pruebas Automatizadas
- [ ] **Pruebas Unitarias con Jest:** Reglas de puntuación, unicidad de respuesta y tiempos pasando en verde (`pnpm test`).
- [ ] **Pruebas de Integración:** Aislamiento de salas concurrentes y consumo externo validados con Jest y Supertest.
- [ ] **Pruebas E2E con Playwright:** Flujo completo multi-usuario pasando sin errores (`pnpm exec playwright test`).

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[Guion de Demostracion en Clase|Ver Guión de la Defensa en Clase]]
- [[05 - Calidad y Pruebas/Casos de Prueba de Juego|Ver Matriz de Comprobaciones]]
