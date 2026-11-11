import { SessionStatus } from "@profelink/shared-dtos";
import { finishedSessionsVisibleTo } from "./session-visibility";

describe("finishedSessionsVisibleTo", () => {
  const filter = finishedSessionsVisibleTo("user-1");

  it("keeps only persisted finished sessions", () => {
    expect(filter.status).toBe(SessionStatus.FINISHED);
    expect(filter.status).not.toBe(SessionStatus.WAITING);
    expect(filter.status).not.toBe(SessionStatus.QUESTION_ACTIVE);
    expect(filter.status).not.toBe(SessionStatus.QUESTION_CLOSED);
  });

  it("limits rows to the host or a recorded participant", () => {
    expect(filter.OR).toEqual([
      { hostId: "user-1" },
      { participants: { some: { userId: "user-1" } } },
    ]);
  });
});
