import { validate } from "class-validator";
import { CreateQuestionDto } from "./create-question.dto";
import { UpdateQuestionDto } from "./update-question.dto";

const RANGE_MESSAGE = "El tiempo debe ser un entero entre 5 y 120 segundos.";

function createDto(timeLimitSeconds: number): CreateQuestionDto {
  const dto = new CreateQuestionDto();
  dto.statement = "La Tierra gira.";
  dto.correctAnswer = true;
  dto.timeLimitSeconds = timeLimitSeconds;
  return dto;
}

function updateDto(timeLimitSeconds: number): UpdateQuestionDto {
  const dto = new UpdateQuestionDto();
  dto.timeLimitSeconds = timeLimitSeconds;
  return dto;
}

async function timeMessage(dto: object): Promise<string | undefined> {
  const errors = await validate(dto);
  const timeError = errors.find((error) => error.property === "timeLimitSeconds");
  return Object.values(timeError?.constraints ?? {})[0];
}

describe("question time DTO bounds", () => {
  it.each([5, 120])("accepts %s seconds on create and update", async (seconds) => {
    await expect(validate(createDto(seconds))).resolves.toEqual([]);
    await expect(validate(updateDto(seconds))).resolves.toEqual([]);
  });

  it.each([4, 121])("rejects %s seconds on create and update", async (seconds) => {
    await expect(timeMessage(createDto(seconds))).resolves.toBe(RANGE_MESSAGE);
    await expect(timeMessage(updateDto(seconds))).resolves.toBe(RANGE_MESSAGE);
  });
});
