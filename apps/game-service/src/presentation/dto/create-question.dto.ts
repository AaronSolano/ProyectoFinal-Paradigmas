import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

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

  @ApiProperty({ minimum: 5, example: 30 })
  @IsInt()
  @Min(5)
  timeLimitSeconds!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
