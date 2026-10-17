---
title: "Bitácora de Aportes y Registro de Trabajo Individual"
parent: "[[00 - MOC ProfeLink]]"
course: "EIF400 - Paradigmas de Programación"
professor: "M.S. Alex Villegas Carranza"
tags:
  - bitacora
  - aportes
  - equipo
  - trazabilidad
  - git
---

# 📖 Bitácora de Aportes y Registro de Trabajo Individual

Este documento registra la distribución de responsabilidades, ramas de Git, Pull Requests y evidencias de participación de los integrantes del equipo para la evaluación individual.

---

## 👥 1. Integrantes del Equipo

| Nombre del Estudiante | Identificación / Carné | Rol Principal en el Proyecto |
| :--- | :--- | :--- |
| **Integrante 1** | Carné XXXX | Arquitectura de Backend (`game-service`), Arquitectura en Layers y Jest. |
| **Integrante 2** | Carné XXXX | Seguridad y Autenticación (`auth-service`), JWT Audience y Scalar API. |
| **Integrante 3** | Carné XXXX | Frontend React (`web-client`), WebSockets y Pruebas con Playwright. |
| **Integrante 4** | Carné XXXX | Infraestructura Docker, Observabilidad (OTel + Grafana) y Consumidor Externo. |

---

## 📅 2. Registro Cronológico de Aportes (Changelog de Equipo)

| Fecha | Autor | Módulo / Característica | Ramas y Commits Clave | PR Asociado |
| :--- | :--- | :--- | :--- | :--- |
| **Semana 1** | Integrante 1 & 2 | Configuración del monorepo (`pnpm`), Docker Compose base y esquemas PostgreSQL. | `feat/monorepo-setup` | PR #1 |
| **Semana 1** | Integrante 2 | Implementación de `auth-service`, hashing con bcrypt y emisión de JWT con claim `aud`. | `feat/auth-jwt-audience` | PR #2 |
| **Semana 2** | Integrante 1 | Diseño de Capa de Servicios en `game-service` (`GameSessionService`, reglas de puntaje e inmutabilidad). | `feat/layered-architecture` | PR #3 |
| **Semana 2** | Integrante 3 | Desarrollo del frontend en React: Vistas de Login, Dashboard de Quizzes y creación de preguntas. | `feat/react-dashboard` | PR #4 |
| **Semana 3** | Integrante 1 & 3 | Gateway de WebSockets (`Socket.io`), eventos de apertura de preguntas y temporizador en servidor. | `feat/websocket-gateway` | PR #5 |
| **Semana 3** | Integrante 1 | Lógica de reconexión transparente (`room:state_sync`) y prevención de doble votación. | `feat/reconnection-logic` | PR #6 |
| **Semana 4** | Integrante 4 | Configuración de OpenTelemetry Collector y paneles visuales en Grafana. | `feat/otel-grafana` | PR #7 |
| **Semana 4** | Integrante 4 | Desarrollo del cliente externo en puerto `5174` y script automatizado `start.sh`. | `feat/external-consumer` | PR #8 |
| **Semana 5** | Integrante 1 & 3 | Cobertura de pruebas unitarias en Jest y suite E2E con Playwright. | `test/jest-playwright` | PR #9 |
| **Semana 5** | Todo el Equipo | Simulación general de la defensa, verificación de checklist y congelamiento de versión. | `release/v1.0.0` | PR #10 |

---

## 🔍 3. Trazabilidad con Git y OpenSpec

- Todas las ramas de trabajo fueron desprendidas de `develop` y fusionadas mediante Pull Requests revisados por al menos otro integrante del equipo.
- Cada Pull Request referencia una especificación documentada en la carpeta `/openspec`.
- Las contribuciones individuales pueden verificarse en el historial de Git mediante:
  ```bash
  git shortlog -sn --all
  ```

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[03 - Contratos y Especificaciones/OpenSpec y PRs|Flujo de OpenSpec y PRs]]
- [[Checklist de Verificacion|Checklist de Evaluación]]
- [[Guion de Demostracion en Clase|Guión de Demostración]]
