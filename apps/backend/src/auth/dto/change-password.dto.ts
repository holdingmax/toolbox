import { IsString, MinLength } from 'class-validator'

export class ChangePasswordDto {
  @IsString()
  contraseña_actual: string

  @IsString()
  @MinLength(6)
  nueva_contraseña: string
}
