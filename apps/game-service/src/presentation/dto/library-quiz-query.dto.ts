import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import {
  CHALLENGE_CATEGORIES,
  ChallengeCategoryCode,
} from "../../persistence/challenge-bank.catalog";

export class LibraryQuizQueryDto {
  @ApiPropertyOptional({ enum: CHALLENGE_CATEGORIES })
  @IsOptional()
  @IsIn(CHALLENGE_CATEGORIES)
  category?: ChallengeCategoryCode;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  pageSize?: number;
}
