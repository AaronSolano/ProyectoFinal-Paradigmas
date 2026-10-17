---
title: "Casos de Prueba de Juego y Comprobaciones Obligatorias"
parent: "[[00 - MOC ProfeLink]]"
tags:
  - testing
  - pruebas-integracion
  - jest
  - comprobaciones
  - rubrica
---

# 🎯 Casos de Prueba de Juego y Comprobaciones Obligatorias

Este documento detalla la correspondencia exacta entre las **6 comprobaciones obligatorias** establecidas en la rúbrica del profesor M.S. Alex Villegas y las pruebas automatizadas implementadas con **Jest** y **Supertest** en el proyecto.

---

## 📊 Matriz de Comprobaciones vs. Solución Técnica

| # | Caso de Comprobación | Qué se comprueba | Mecanismo Técnico | Prueba en Jest / Test Suite |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Acceso y Permisos** | El propietario administra sus cuestionarios y su sala. Un participante no puede alterar preguntas ajenas ni controlar la partida. Canal WS protegido. | `JwtAuthGuard` + validación de `quiz.ownerId === user.sub` y `session.hostId === user.sub`. | `test/permissions.spec.ts` |
| **2** | **Juego Simultáneo** | Todos reciben la misma pregunta e imagen. Las salas no mezclan mensajes, participantes ni puntajes. | Rooms independientes en Socket.io (`to(roomCode).emit(...)`) y aislamiento de estado en memoria. | `test/concurrent-rooms.e2e-spec.ts` |
| **3** | **Respuestas Válidas** | Máximo 1 respuesta por jugador/pregunta. Reenvíos no suman. Respuestas tardías son rechazadas. Respuesta correcta se revela solo al cerrar. | `Map<questionId, Set<userId>>` en `GameSession` + validación contra `expiresAt`. Ocultamiento en DTO. | `test/answer-validation.spec.ts` |
| **4** | **Reconexión** | Al perder conexión o recargar página, el jugador vuelve a la misma sala, conserva su puntaje y no se duplica. | Detección de `userId` en `room:join`, actualización de `socket.id` y emisión de `room:state_sync`. | `test/reconnection.spec.ts` |
| **5** | **Persistencia** | Tras `docker compose restart`, siguen disponibles perfiles, quizzes, imágenes y resultados de partidas finalizadas. | Volúmenes nombrados en Docker Compose (`pgdata` y `quiz_images`). | Script de prueba manual de persistencia. |
| **6** | **Consumo Independiente** | Un cliente web externo consulta una sesión o resultados usando el API documentada y el token JWT. | Aplicación `external-consumer` en puerto 5174 consumiendo `auth-service` y `game-service` vía REST. | `test/external-consumer.e2e-spec.ts` |

---

## 💻 2. Detalle de Pruebas Críticas en Jest

### Caso 2: Aislamiento Concurrente de Salas (`concurrent-rooms.e2e-spec.ts`)
Verifica que las emisiones de Socket.io queden confinadas a la sala correspondiente:

```typescript
describe('E2E - Aislamiento Concurrente de Salas', () => {
  let clientRoomA1: Socket, clientRoomA2: Socket;
  let clientRoomB1: Socket, clientRoomB2: Socket;

  it('no debe filtrar eventos de SALA_A hacia los clientes de SALA_B', (done) => {
    let salaBReceivedEvent = false;

    // Clientes de Sala B a la escucha
    clientRoomB1.on('game:question_opened', () => {
      salaBReceivedEvent = true;
    });

    // Anfitrión de Sala A emite inicio de pregunta
    clientHostA.emit('game:start_question', { roomCode: 'SALA_A', questionIndex: 0 });

    // Verificación asíncrona
    setTimeout(() => {
      expect(salaBReceivedEvent).toBe(false);
      done();
    }, 500);
  });
});
```

---

### Caso 6: Prueba de Consumidor Externo (`external-consumer.e2e-spec.ts`)
Verifica el ciclo de vida completo de un tercero consumiendo la API:

```typescript
describe('E2E - Consumo de API por Terceros', () => {
  it('debe autenticar contra auth-service y consultar resultados en game-service', async () => {
    // 1. Obtener JWT con aud: profelink-game-api
    const authRes = await request('http://localhost:3001')
      .post('/api/auth/login')
      .send({ email: 'profe@profelink.cr', password: 'Password123!' });
    
    expect(authRes.status).toBe(200);
    const token = authRes.body.accessToken;

    // 2. Consumir API de juego con el token
    const resultsRes = await request('http://localhost:3002')
      .get(`/api/sessions/${demoSessionId}/results`)
      .set('Authorization', `Bearer ${token}`);

    expect(resultsRes.status).toBe(200);
    expect(resultsRes.body).toHaveProperty('podium');
    expect(Array.isArray(resultsRes.body.podium)).toBe(true);
  });
});
```

---

## 🔗 Enlaces Relacionados
- [[00 - MOC ProfeLink|Volver al MOC]]
- [[Estrategia de Pruebas Unitarias (Jest)|Estrategia General de Jest]]
- [[06 - Entrega y Defensa/Checklist de Verificacion|Checklist de Comprobaciones]]
- [[06 - Entrega y Defensa/Guion de Demostracion en Clase|Guión de Demostración en Clase]]
