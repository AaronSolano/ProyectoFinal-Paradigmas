import { ArgumentsHost, Catch, Logger } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";
import type { Socket } from "socket.io";

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    const message =
      exception instanceof WsException
        ? exception.getError()
        : exception instanceof Error
          ? exception.message
          : "Error en WebSocket";

    this.logger.warn(`WS error (${client.id}): ${String(message)}`);
    client.emit("exception", { message: String(message) });
  }
}
