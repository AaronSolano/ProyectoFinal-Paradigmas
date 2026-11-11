## Purpose

Permite que los navegadores de los clientes web locales llamen por HTTP a auth-service y game-service, incluida la petición preflight que dispara un encabezado de autorización.

## ADDED Requirements

### Requirement: Cross-origin HTTP access from local web clients
The system SHALL allow browser HTTP calls from `http://localhost:5173` and `http://localhost:5174` to both auth-service and game-service. It SHALL also allow an origin listed in `CORS_ORIGINS`. It SHALL refuse every other origin and SHALL NOT emit a wildcard.

#### Scenario: HTTP request from the web client
- **WHEN** the browser at `http://localhost:5173` sends an HTTP request to auth-service or game-service
- **THEN** the response includes `Access-Control-Allow-Origin` set to `http://localhost:5173` and the browser is allowed to read the response

#### Scenario: HTTP request from the external consumer
- **WHEN** the browser at `http://localhost:5174` sends an HTTP request to auth-service or game-service
- **THEN** the response includes `Access-Control-Allow-Origin` set to `http://localhost:5174` and the browser is allowed to read the response

#### Scenario: Preflight from the web client
- **WHEN** the browser at `http://localhost:5173` sends an `OPTIONS` preflight to auth-service or game-service with `Access-Control-Request-Method` of `GET`, `POST`, `PATCH`, or `DELETE` and `Access-Control-Request-Headers` including `authorization` and `content-type`
- **THEN** the service responds with a successful status and allows that origin, the requested method, and the headers `Authorization` and `Content-Type`

#### Scenario: Preflight from the external consumer
- **WHEN** the browser at `http://localhost:5174` sends an `OPTIONS` preflight to auth-service or game-service with `Access-Control-Request-Method` of `GET`, `POST`, `PATCH`, or `DELETE` and `Access-Control-Request-Headers` including `authorization` and `content-type`
- **THEN** the service responds with a successful status and allows that origin, the requested method, and the headers `Authorization` and `Content-Type`

#### Scenario: Configured production origin
- **WHEN** `CORS_ORIGINS` contains `https://VERCEL_WEB_HOST` and that browser origin calls auth-service or game-service
- **THEN** the response includes `Access-Control-Allow-Origin` set to that exact origin

#### Scenario: Origin outside the allowed pair
- **WHEN** a browser origin other than `http://localhost:5173`, `http://localhost:5174`, or an entry of `CORS_ORIGINS` sends a cross-origin request or `OPTIONS` preflight to auth-service or game-service
- **THEN** the response does not grant that origin access
