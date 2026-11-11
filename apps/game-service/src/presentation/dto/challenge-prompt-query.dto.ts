import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";
import {
  CHALLENGE_CATEGORIES,
  CHALLENGE_DIFFICULTIES,
  ChallengeCategoryCode,
  ChallengeDifficultyCode,
} from "../../persistence/challenge-bank.catalog";

export class ChallengePromptQueryDto {
  @ApiPropertyOptional({ minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  q?: string;

  @ApiPropertyOptional({ enum: CHALLENGE_CATEGORIES })
  @IsOptional()
  @IsIn(CHALLENGE_CATEGORIES)
  category?: ChallengeCategoryCode;

  @ApiPropertyOptional({ enum: CHALLENGE_DIFFICULTIES })
  @IsOptional()
  @IsIn(CHALLENGE_DIFFICULTIES)
  difficulty?: ChallengeDifficultyCode;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  pageSize?: number;
}
