import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string

  @IsOptional()
  @IsString()
  rol_id?: string

  @IsOptional()
  @IsBoolean()
  activo?: boolean
}
