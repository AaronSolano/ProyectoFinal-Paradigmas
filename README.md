# 🎓 ProfeLink — Evaluaciones en Vivo (Kahoot V/F)

> Sistema de evaluaciones formativas y cuestionarios en tiempo real tipo **Kahoot (Verdadero/Falso)** diseñado para la plataforma académica **ProfeLink**.

**Curso:** EIF400 - Paradigmas de Programación  
**Profesor:** M.S. Alex Villegas Carranza  
**Ciclo:** II Ciclo 2026  
**Estudiante:** Aaron Solano  

---

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

## 🗺️ Estructura del Repositorio y Documentación

La documentación detallada se encuentra estructurada como una bóveda de conocimiento en [`ProfeLink-Evaluaciones/`](./ProfeLink-Evaluaciones/):

- [`00 - MOC ProfeLink.md`](./ProfeLink-Evaluaciones/00%20-%20MOC%20ProfeLink.md) — Índice y mapa general de contenido (Map of Content).
- **`01 - Requerimientos y Alcance/`**
  - [Enunciado del Proyecto](./ProfeLink-Evaluaciones/01%20-%20Requerimientos%20y%20Alcance/Enunciado%20del%20Proyecto.md)
  - [Casos de Uso](./ProfeLink-Evaluaciones/01%20-%20Requerimientos%20y%20Alcance/Casos%20de%20Uso.md)
  - [Reglas del Juego y Negocio](./ProfeLink-Evaluaciones/01%20-%20Requerimientos%20y%20Alcance/Reglas%20del%20Juego%20y%20Negocio.md)
- **`02 - Arquitectura y Diseno/`**
  - [Arquitectura del Sistema](./ProfeLink-Evaluaciones/02%20-%20Arquitectura%20y%20Diseno/Arquitectura%20del%20Sistema.md)
  - [Diseño Interno (Arquitectura en Capas - Layers)](./ProfeLink-Evaluaciones/02%20-%20Arquitectura%20y%20Diseno/Diseno%20Interno%20(Arquitectura%20en%20Capas%20-%20Layers).md)
  - [Modelo de Datos (ERD)](./ProfeLink-Evaluaciones/02%20-%20Arquitectura%20y%20Diseno/Modelo%20de%20Datos%20(ERD).md)
  - [Diagrama de Clases](./ProfeLink-Evaluaciones/02%20-%20Arquitectura%20y%20Diseno/Diagrama%20de%20Clases.md)
- **`03 - Contratos y Especificaciones/`**
  - [Auth Service API (OpenAPI)](./ProfeLink-Evaluaciones/03%20-%20Contratos%20y%20Especificaciones/Auth%20Service%20API%20(OpenAPI).md)
  - [Game Service API (OpenAPI)](./ProfeLink-Evaluaciones/03%20-%20Contratos%20y%20Especificaciones/Game%20Service%20API%20(OpenAPI).md)
  - [Eventos WebSockets](./ProfeLink-Evaluaciones/03%20-%20Contratos%20y%20Especificaciones/Eventos%20WebSockets%20(Socket.io).md)
  - [OpenSpec y PRs](./ProfeLink-Evaluaciones/03%20-%20Contratos%20y%20Especificaciones/OpenSpec%20y%20PRs.md)
- **`04 - Infraestructura y Despliegue/`**
  - [Docker y Compose](./ProfeLink-Evaluaciones/04%20-%20Infraestructura%20y%20Despliegue/Docker%20y%20Compose.md)
  - [Variables de Entorno y Secretos](./ProfeLink-Evaluaciones/04%20-%20Infraestructura%20y%20Despliegue/Variables%20de%20Entorno%20y%20Secretos.md)
  - [Observabilidad (OTel y Grafana)](./ProfeLink-Evaluaciones/04%20-%20Infraestructura%20y%20Despliegue/Observabilidad%20(OTel%20y%20Grafana).md)
  - [Script de Inicio y Seed](./ProfeLink-Evaluaciones/04%20-%20Infraestructura%20y%20Despliegue/Script%20de%20Inicio%20y%20Seed.md)
- **`05 - Calidad y Pruebas/`**
  - [Estrategia de Pruebas Unitarias (Jest)](./ProfeLink-Evaluaciones/05%20-%20Calidad%20y%20Pruebas/Estrategia%20de%20Pruebas%20Unitarias%20(Jest).md)
  - [Casos de Prueba de Juego](./ProfeLink-Evaluaciones/05%20-%20Calidad%20y%20Pruebas/Casos%20de%20Prueba%20de%20Juego.md)
  - [Pruebas E2E (Playwright)](./ProfeLink-Evaluaciones/05%20-%20Calidad%20y%20Pruebas/Pruebas%20E2E%20(Playwright).md)
- **`06 - Entrega y Defensa/`**
  - [Checklist de Verificación](./ProfeLink-Evaluaciones/06%20-%20Entrega%20y%20Defensa/Checklist%20de%20Verificacion.md)
  - [Bitácora de Aportes](./ProfeLink-Evaluaciones/06%20-%20Entrega%20y%20Defensa/Bitacora%20de%20Aportes.md)
  - [Guion de Demostración en Clase](./ProfeLink-Evaluaciones/06%20-%20Entrega%20y%20Defensa/Guion%20de%20Demostracion%20en%20Clase.md)

---

## 🛠️ Stack Tecnológico

- **Backend:** Node.js, NestJS, TypeScript, Socket.io, Prisma / TypeORM
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Testing:** Jest, Supertest, Playwright
- **Infraestructura:** Docker, Docker Compose, PostgreSQL / Redis
- **Monitoreo:** OpenTelemetry, Prometheus, Grafana
