import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@profelink/auth-prisma";
import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "nuevo@profelink.cr" })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: "Profelink123!" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: "Docente Demo" })
  @IsString()
  @MinLength(2)
  displayName!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.HOST })
  @IsEnum(UserRole)
  role!: UserRole;
}
