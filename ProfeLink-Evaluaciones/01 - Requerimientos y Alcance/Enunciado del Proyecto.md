---
title: "Enunciado del Proyecto: Evaluaciones en Vivo para ProfeLink"
parent: "[[00 - MOC ProfeLink]]"
course: "EIF400 - Paradigmas de Programación"
professor: "M.S. Alex Villegas Carranza"
cycle: "II Ciclo 2026"
weight: "30% (40 pts)"
tags:
  - requerimientos
  - enunciado
  - eif400
  - universidad
---

# 📋 Enunciado del Proyecto: Evaluaciones en Vivo para ProfeLink

> [!info] Metadatos de Evaluación
> - **Curso:** EIF400 - Paradigmas de Programación
> - **Profesor:** M.S. Alex Villegas Carranza
> - **Ponderación:** 30% de la nota final (40 puntos netos)
> - **Modalidad:** Demostración en vivo, pruebas automatizadas y defensa individual

---

## 🎯 1. Contexto y Problema
En el contexto universitario actual, mantener la concentración de los estudiantes durante sesiones magistrales de programación representa un reto pedagógico significativo. La plataforma **ProfeLink** busca incorporar un módulo interactivo de evaluación rápida tipo **Kahoot** basado en preguntas binarias (**Verdadero o Falso**) con apoyo visual.

Este módulo debe operar como un ecosistema de **servicios autónomos**, permitiendo:
1. Al docente: Crear cuestionarios visuales, proyectar preguntas en la pizarra y orquestar sesiones de juego en tiempo real.
2. A los estudiantes: Conectarse desde sus celulares o computadoras usando un código de sala (PIN) y responder en ventanas de tiempo acotadas.
3. A sistemas externos: Integrarse a través de APIs REST seguras y documentadas sin comprometer la base de datos interna.

---

## 🏆 2. Objetivos Principales

### 2.1 Objetivos Técnicos
- **Desacoplamiento de Seguridad:** Separar la emisión de identidades (`auth-service`) del motor de juego (`game-service`), empleando tokens JWT con restricción de audiencia (`aud: "profelink-game-api"`).
- **Comunicación en Tiempo Real:** Orquestar salas aisladas mediante **WebSockets (Socket.io)** asegurando que eventos como aperturas de preguntas, timers y resultados no colisionen.
- **Arquitectura en Capas (Layered Architecture - Layers):** Organizar el backend en capas jerárquicas (Presentación, Servicios/Negocio y Acceso a Datos) en NestJS de modo que la lógica de juego se pruebe con **Jest** desacoplada de la infraestructura.
- **Observabilidad Operativa:** Instrumentar ambos backends con **OpenTelemetry** para exportar trazas y métricas hacia Grafana, permitiendo diagnosticar cuellos de botella y latencias.
- **Reproducibilidad Inmediata:** Disponer de un script de arranque automatizado (`start.sh` / `start.ps1`) y Docker Compose que descargue o compile los servicios, ejecute migraciones y cargue datos semilla (seed).

### 2.2 Objetivos de Negocio
- Facilitar diagnósticos formativos de menos de 5 minutos en clase.
- Garantizar la justicia del juego: evitar doble votación, descartar respuestas fuera de tiempo y asegurar el cálculo de puntajes en el servidor.
- Permitir la reconexión transparente de estudiantes ante fluctuaciones de red.

---

## 📦 3. Entregables y Criterios de Éxito

| Entregable | Descripción | Criterio de Aceptación |
| :--- | :--- | :--- |
| **Monorepo Funcional** | Código fuente estructurado con `pnpm workspaces`. | Compilación sin errores TypeScript y linter estricto. |
| **APIs Documentadas** | Endpoints de `auth-service` y `game-service` documentados con **Scalar/OpenAPI**. | Accesibles en `/reference`, con esquemas y respuestas de error. |
| **Suite de Testing** | Pruebas unitarias y de integración con **Jest**, y E2E con **Playwright**. | Cobertura de las 6 comprobaciones obligatorias sin fallos. |
| **Infraestructura Docker** | `docker-compose.yml` con persistencia en volúmenes (`pgdata`, `uploads`). | Persistencia confirmada tras `docker compose restart`. |
| **Cliente Externo** | Aplicación web independiente consumiendo la API de juego. | Login y consulta de resultados exitosos en puerto `5174`. |
| **Defensa Oral** | Explicación arquitectónica y justificación de decisiones en clase. | Dominio de Clean Architecture, claims JWT y WebSockets. |

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC Principal]]
- [[Casos de Uso|Ver Casos de Uso del Sistema]]
- [[Reglas del Juego y Negocio|Ver Reglas del Juego y Negocio]]
- [[06 - Entrega y Defensa/Guion de Demostracion en Clase|Ver Guión de Demostración para la Defensa]]
