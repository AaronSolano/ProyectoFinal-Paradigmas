import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsUUID } from "class-validator";

export class CopyChallengePromptsDto {
  @ApiProperty({ type: [String], minItems: 1, maxItems: 20 })
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID("4", { each: true })
  promptIds!: string[];
}
