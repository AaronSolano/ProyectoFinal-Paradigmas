import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import {
  CHALLENGE_CATEGORIES,
  ChallengeCategoryCode,
} from "../../persistence/challenge-bank.catalog";

export class UpdateQuizDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CHALLENGE_CATEGORIES })
  @IsOptional()
  @IsIn(CHALLENGE_CATEGORIES)
  category?: ChallengeCategoryCode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

