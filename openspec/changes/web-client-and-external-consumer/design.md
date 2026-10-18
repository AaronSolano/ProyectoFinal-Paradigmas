## Context

Las aplicaciones web proporcionan el punto de contacto para usuarios finales (profesores y estudiantes) y auditores académicos. La separación de `web-client` y `external-consumer` demuestra el desacoplamiento real de la arquitectura distribuida. Véase `proposal.md` para el contexto.

## Goals / Non-Goals

**Goals:**
- Desarrollar `apps/web-client` con React 18, Vite y Tailwind CSS en el puerto `5173`.
- Implementar flujo de anfitrión (creador de quizzes, lobby, proyección con temporizador, podio).
- Implementar flujo de participante (lobby, botones gigantes V/F, feedback de ronda).
- Desarrollar `apps/external-consumer` en el puerto `5174` como micro-aplicación independiente.
- Escribir prueba automatizada de integración en Jest para el consumidor externo (`external-consumer.e2e-spec.ts`).

**Non-Goals:**
- No incluye edición de código en vivo ni IDEs integrados.
- No incluye pagos ni comercio electrónico.

## Decisions

### 1. Stack de Frontend: React + Vite + Tailwind CSS
- **Decisión**: Utilizar Vite con React 18 y Tailwind CSS para estilizado responsivo.
- **Racional**: Tiempos de arranque ultrarrápidos, recarga en caliente instantánea (HMR) y adaptabilidad perfecta para pantallas móviles de estudiantes y proyectores de aula.

### 2. Gestión de Conexiones en Tiempo Real
- **Decisión**: Encapsular la instancia de Socket.io en un hook personalizado `useGameSocket` con reintento automático de conexión y despacho de acciones según eventos recibidos.
- **Racional**: Simplifica los componentes de vista y garantiza el manejo consistente de reconexiones y estados de error.

### 3. Independencia de `external-consumer`
- **Decisión**: Estructurar `apps/external-consumer` como un proyecto completamente desacoplado con su propio `package.json` y `Dockerfile` en el puerto `5174`.
- **Racional**: Cumple con la Comprobación 6 de la rúbrica donde se exige demostrar que un cliente externo sin acceso al código del juego puede consultar resultados consumiendo únicamente la API pública.

## Risks / Trade-offs

- **[Riesgo: Latencia de renderizado en temporizadores de cuenta regresiva]** → **Mitigación**: Sincronizar el reloj del cliente con el `expiresAt` provisto por el servidor (`remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))`).
- **[Riesgo: CORS al comunicar frontends con backends]** → **Mitigación**: Habilitar CORS en NestJS para los orígenes `http://localhost:5173` y `http://localhost:5174`.
