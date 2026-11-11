import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "profe@profelink.cr" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Profelink123!" })
  @IsString()
  @MinLength(8)
  password!: string;
}
