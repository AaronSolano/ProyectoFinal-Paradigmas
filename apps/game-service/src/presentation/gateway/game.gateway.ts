import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Logger, UseFilters, UseGuards } from "@nestjs/common";
import type {
  GameCloseQuestionPayload,
  GameFinishPayload,
  GameStartQuestionPayload,
  GameSubmitAnswerPayload,
  RoomJoinPayload,
} from "@profelink/shared-dtos";
import { WsEventNames } from "@profelink/shared-dtos";
import type { Server, Socket } from "socket.io";
import { AuthUser } from "../../entities/auth-user";
import {
  RoomEventEmitter,
  RoomManagerService,
} from "../../services/realtime/room-manager.service";
import { WsJwtGuard } from "../guards/ws-jwt.guard";
import { WsExceptionFilter } from "../filters/ws-exception.filter";

type AuthedSocket = Socket & { data: { user?: AuthUser; roomCode?: string } };

@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
@UseFilters(WsExceptionFilter)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly rooms: RoomManagerService,
    private readonly wsJwt: WsJwtGuard,
  ) {}

  handleConnection(client: AuthedSocket): void {
    try {
      const user = this.wsJwt.authenticateSocket(client);
      client.data.user = user;
    } catch (err) {
      this.logger.warn(`Conexión rechazada: ${String(err)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket): void {
    void client.data.roomCode;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WsEventNames.ROOM_JOIN)
  onRoomJoin(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: RoomJoinPayload,
  ): void {
    const user = client.data.user!;
    const room = this.rooms.joinRoom(
      user,
      payload.roomCode,
      payload.displayName,
      client.id,
      this.emitter(),
    );
    void client.join(room.roomCode);
    client.data.roomCode = room.roomCode;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WsEventNames.GAME_START_QUESTION)
  onStartQuestion(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: GameStartQuestionPayload,
  ): void {
    const user = client.data.user!;
    const roomCode = client.data.roomCode;
    if (!roomCode) {
      return;
    }
    this.rooms.startQuestion(
      user,
      roomCode,
      payload.questionIndex,
      this.emitter(),
      (code, index) => this.autoCloseQuestion(code, index),
    );
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WsEventNames.GAME_CLOSE_QUESTION)
  onCloseQuestion(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: GameCloseQuestionPayload,
  ): void {
    const user = client.data.user!;
    const roomCode = client.data.roomCode;
    if (!roomCode) {
      return;
    }
    this.rooms.closeQuestion(user, roomCode, payload.questionIndex, this.emitter());
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WsEventNames.GAME_SUBMIT_ANSWER)
  onSubmitAnswer(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: GameSubmitAnswerPayload,
  ): void {
    const user = client.data.user!;
    const roomCode = client.data.roomCode;
    if (!roomCode) {
      return;
    }
    this.rooms.submitAnswer(user, roomCode, payload.answer, this.emitter(), client.id);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WsEventNames.GAME_FINISH)
  async onFinish(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: GameFinishPayload,
  ): Promise<void> {
    const user = client.data.user!;
    const roomCode = payload.roomCode || client.data.roomCode;
    if (!roomCode) {
      return;
    }
    await this.rooms.finishGame(user, roomCode, this.emitter());
    await client.leave(roomCode);
    client.data.roomCode = undefined;
  }

  private autoCloseQuestion(roomCode: string, questionIndex: number): void {
    try {
      this.rooms.closeQuestion(null, roomCode, questionIndex, this.emitter());
    } catch (err) {
      this.logger.debug(`Auto-cierre omitido: ${String(err)}`);
    }
  }

  private emitter(): RoomEventEmitter {
    return {
      toRoom: (roomCode, event, payload) => {
        this.server.to(roomCode).emit(event, payload);
      },
      toClient: (socketId, event, payload) => {
        this.server.to(socketId).emit(event, payload);
      },
    };
  }
}
