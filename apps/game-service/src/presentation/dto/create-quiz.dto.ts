import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";
import {
  CHALLENGE_CATEGORIES,
  ChallengeCategoryCode,
} from "../../persistence/challenge-bank.catalog";

export class CreateQuizDto {
  @ApiProperty({ example: "Paradigmas â€” Repaso V/F" })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CHALLENGE_CATEGORIES })
  @IsOptional()
  @IsIn(CHALLENGE_CATEGORIES)
  category?: ChallengeCategoryCode;
}

