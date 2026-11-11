import { Module } from "@nestjs/common";
import { GameEngineService } from "./realtime/game-engine.service";
import { InMemoryRoomStore } from "./realtime/in-memory-room.store";
import { RoomManagerService } from "./realtime/room-manager.service";
import { LocalStorageService } from "./local-storage.service";
import { ChallengeBankService } from "./challenge-bank.service";
import { QuizService } from "./quiz.service";
import { SessionResultsService } from "./session-results.service";

@Module({
  providers: [
    QuizService,
    ChallengeBankService,
    SessionResultsService,
    LocalStorageService,
    InMemoryRoomStore,
    GameEngineService,
    RoomManagerService,
  ],
  exports: [
    QuizService,
    ChallengeBankService,
    SessionResultsService,
    LocalStorageService,
    RoomManagerService,
    GameEngineService,
    InMemoryRoomStore,
  ],
})
export class ServicesModule {}
