import { Module } from "@nestjs/common";
import { GameEngineService } from "./realtime/game-engine.service";
import { InMemoryRoomStore } from "./realtime/in-memory-room.store";
import { RoomManagerService } from "./realtime/room-manager.service";
import { LocalStorageService } from "./local-storage.service";
import { QuizService } from "./quiz.service";

@Module({
  providers: [
    QuizService,
    LocalStorageService,
    InMemoryRoomStore,
    GameEngineService,
    RoomManagerService,
  ],
  exports: [
    QuizService,
    LocalStorageService,
    RoomManagerService,
    GameEngineService,
    InMemoryRoomStore,
  ],
})
export class ServicesModule {}
