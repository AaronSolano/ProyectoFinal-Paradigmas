import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class CreateQuestionDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  statement!: string;

  @ApiPropertyOptional({ example: "/uploads/example.webp" })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty()
  @IsBoolean()
  correctAnswer!: boolean;

  @ApiProperty({ minimum: 5, maximum: 120, example: 30 })
  @IsInt({ message: "El tiempo debe ser un entero entre 5 y 120 segundos." })
  @Min(5, { message: "El tiempo debe ser un entero entre 5 y 120 segundos." })
  @Max(120, { message: "El tiempo debe ser un entero entre 5 y 120 segundos." })
  timeLimitSeconds!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
