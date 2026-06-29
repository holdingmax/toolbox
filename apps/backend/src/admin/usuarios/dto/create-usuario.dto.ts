import { IsEmail, IsString, MinLength } from 'class-validator'

export class CreateUsuarioDto {
  @IsString()
  @MinLength(2)
  nombre: string

  @IsEmail({}, { message: 'Email inválido' })
  email: string

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string

  @IsString()
  rol_id: string
}
