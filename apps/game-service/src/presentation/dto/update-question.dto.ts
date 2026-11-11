import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  statement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  correctAnswer?: boolean;

  @ApiPropertyOptional({ minimum: 5, maximum: 120 })
  @IsOptional()
  @IsInt({ message: "El tiempo debe ser un entero entre 5 y 120 segundos." })
  @Min(5, { message: "El tiempo debe ser un entero entre 5 y 120 segundos." })
  @Max(120, { message: "El tiempo debe ser un entero entre 5 y 120 segundos." })
  timeLimitSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
