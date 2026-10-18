

## 📌 Visión General

ProfeLink Evaluaciones es una solución distribuida en tiempo real que permite a los docentes lanzar dinámicas de evaluación rápida tipo Verdadero/Falso durante las sesiones sincrónicas o asincrónicas.

### ✨ Características Principales
- **Desacoplamiento de Autenticación:** `auth-service` emite JWT con verificación estricta de claims (`aud: "profelink-game-api"`, `iss: "profelink-auth-service"`).
- **Motor en Tiempo Real:** Comunicación bidireccional de baja latencia con **Socket.io / WebSockets**.
- **Arquitectura en Capas (Layered Architecture):**
  - **Presenters / Gateways:** Exposición HTTP y WebSockets.
  - **Controllers:** Orquestación del flujo y casos de uso.
  - **Services / Domain:** Lógica de negocio pura (temporizadores, puntuación, validación V/F).
  - **Repositories:** Abstracción y persistencia de datos.
- **Contratos OpenAPI / Scalar:** Especificación interactiva para integración segura con sistemas externos.
- **Observabilidad:** Métricas y trazas distribuidas con **OpenTelemetry** y dashboards en **Grafana**.
- **Testing Exhaustivo:** Suites unitarias y de integración con **Jest**, y pruebas end-to-end con **Playwright**.

---


## 🛠️ Stack Tecnológico

- **Backend:** Node.js, NestJS, TypeScript, Socket.io, Prisma / TypeORM
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Testing:** Jest, Supertest, Playwright
- **Infraestructura:** Docker, Docker Compose, PostgreSQL / Redis
- **Monitoreo:** OpenTelemetry, Prometheus, Grafana
