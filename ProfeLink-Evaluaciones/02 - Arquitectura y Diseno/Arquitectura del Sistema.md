---
title: "Arquitectura del Sistema: Servicios Autónomos"
parent: "[[00 - MOC ProfeLink]]"
tags:
  - arquitectura
  - microservicios
  - nestjs
  - docker
  - opentelemetry
---

# 🏗️ Arquitectura del Sistema: Servicios Autónomos

Este documento define la arquitectura general del sistema **ProfeLink - Evaluaciones en Vivo**, sus límites de contexto (Bounded Contexts), esquemas de comunicación y la justificación técnica requerida para la defensa ante el profesor.

---

## 🏛️ 1. Estilo Arquitectónico: Microservicios Autónomos en Monorepo

Se implementa una arquitectura basada en **Servicios Autónomos (Microservicios Ligeros)** coordinados mediante un monorepo gestionado por `pnpm workspaces`:

```
profelink-monorepo/
├── apps/
│   ├── auth-service/        # API NestJS: Autenticación, Usuarios y Emisión de JWT
│   ├── game-service/        # API NestJS: Kahoot Engine, Quizzes, WebSockets
│   ├── web-client/          # SPA React + Vite + Tailwind: Profesor y Alumnos
│   └── external-consumer/   # Micro-app web / script: Demostración de cliente tercero
├── packages/
│   └── shared-dtos/         # Tipos compartidos, contratos y payloads de eventos
├── docker-compose.yml       # Orquestación de infraestructura local
└── openspec/                # Especificaciones de cambio y contratos
```

---

## 🗺️ 2. Diagrama de Topología del Sistema

```mermaid
graph TD
    subgraph "Capa de Clientes (Frontends)"
        WEB["🌐 Frontend Principal<br/>React + Vite + TailwindCSS<br/>(Puerto 5173 / Nginx 80)"]
        EXT["🔌 Cliente Externo de Prueba<br/>Micro-app Independiente<br/>(Puerto 5174)"]
    end

    subgraph "Capa de Servicios Autónomos (NestJS)"
        AUTH["🔐 Auth Service API<br/>NestJS + Passport + JWT<br/>(Puerto 3001)"]
        GAME["🎮 Game Service API & Sockets<br/>NestJS + Socket.io + Clean Arch<br/>(Puerto 3002)"]
    end

    subgraph "Capa de Persistencia y Volúmenes"
        DB_AUTH[("🗄️ PostgreSQL<br/>Esquema Auth")]
        DB_GAME[("🗄️ PostgreSQL<br/>Esquema Game")]
        VOL[/"📁 Volumen Persistente<br/>quiz_images: /app/uploads"/]
    end

    subgraph "Capa de Observabilidad Distribuida"
        OTEL["📡 OpenTelemetry Collector<br/>gRPC / OTLP (4317/4318)"]
        GRAF["📊 Grafana + Prometheus / Tempo<br/>Dashboards y Trazas (Puerto 3000)"]
    end

    %% Relaciones de Autenticación
    WEB -->|"1. Login / Registro (REST HTTP)"| AUTH
    EXT -->|"1. Login con credenciales de prueba"| AUTH
    AUTH -->|"Emite JWT (aud: profelink-game-api)"| WEB
    AUTH -->|"Emite JWT (aud: profelink-game-api)"| EXT

    %% Relaciones de Juego y Datos
    WEB -->|"2. CRUD Quizzes y Sesiones (REST + JWT)"| GAME
    WEB <-->|"3. Partida en Vivo (WebSockets + JWT Handshake)"| GAME
    EXT -->|"2. Consulta Resultados REST (Bearer Token)"| GAME

    %% Persistencia
    AUTH --> DB_AUTH
    GAME --> DB_GAME
    GAME --> VOL

    %% Telemetría
    AUTH -.->|"Métricas y Trazas OTLP"| OTEL
    GAME -.->|"Métricas y Trazas OTLP"| OTEL
    OTEL --> GRAF
```

---

## 🔍 3. Justificación de Decisiones Arquitectónicas (Para Defensa)

> [!abstract] Pregunta Típica de Evaluación
> **"¿Por qué separar la autenticación de la lógica del juego en servicios autónomos en vez de un monolito tradicional?"**

### 3.1 Justificación Técnica
1. **Requisito Específico de Auditoría:** El profesor exige demostrar que el API de juego puede ser consumida por terceros independientes reconociendo al servicio de autenticación como proveedor de identidad verificado mediante el claim `aud` (audience).
2. **Ciclos de Escalabilidad Diferenciados:**
   - `auth-service` recibe ráfagas bajas a moderadas de peticiones HTTP (login, validación de perfil).
   - `game-service` sostiene cientos de conexiones persistentes síncronas de WebSocket durante una clase, transmitiendo ráfagas simultáneas de eventos por segundo.
   - Si el motor de juego experimenta saturación, el servicio de autenticación sigue operando con normalidad.
3. **Desacoplamiento de Persistencia:** Ningún servicio accede directamente a la base de datos del otro. Toda interacción se realiza a través de contratos de API REST documentados con OpenAPI.

### 3.2 Compromisos y Costos (Trade-offs)
- **Complejidad de Red y Orquestación:** Requiere gestionar múltiples puertos, variables de entorno cruzadas y orquestación con Docker Compose.
- **Manejo de Errores y Tiempos de Red:** Se debe mitigar fallos transitorios mediante healthchecks y tolerancia a fallos.
- **Monitoreo Distribuido:** Hace imprescindible la inclusión de **OpenTelemetry** para rastrear peticiones que cruzan ambos servicios.

---

## 🔒 4. Mecanismo de Confianza Cero entre Servicios (JWT Audience)

La confianza entre `auth-service` y `game-service` se basa en la criptografía asimétrica/simétrica de los tokens JWT:

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Frontend / Cliente Externo
    participant Auth as Auth Service (3001)
    participant Game as Game Service (3002)

    Cliente->>Auth: POST /api/auth/login { email, password }
    Note over Auth: Verifica hash bcrypt.<br/>Genera JWT con claims:<br/>sub: userId<br/>aud: profelink-game-api<br/>iss: profelink-auth-service
    Auth-->>Cliente: { accessToken, user }

    Cliente->>Game: POST /api/quizzes o WS Handshake con Bearer Token
    Note over Game: JwtAuthGuard valida:<br/>1. Firma válida con JWT_SECRET compartido.<br/>2. Fecha de expiración (exp).<br/>3. aud === 'profelink-game-api'.
    alt Token válido y aud correcto
        Game-->>Cliente: 200 OK / Socket Conectado
    else Token sin claim aud o firma inválida
        Game-->>Cliente: 401 Unauthorized / Handshake Rejected
    end
```

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[Diseno Interno (Arquitectura en Capas - Layers)|Diseño Interno: Arquitectura en Capas (Layers)]]
- [[03 - Contratos y Especificaciones/Auth Service API (OpenAPI)|Contratos de Auth Service]]
- [[04 - Infraestructura y Despliegue/Observabilidad (OTel y Grafana)|Monitoreo con OpenTelemetry y Grafana]]
