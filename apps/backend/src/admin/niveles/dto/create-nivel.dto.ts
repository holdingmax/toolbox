import { IsInt, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateNivelDto {
  @IsString()
  @MinLength(2)
  nombre: string

  @IsString()
  tipo: string

  @IsString()
  @IsOptional()
  descripcion?: string

  @IsString()
  @IsOptional()
  parent_id?: string

  @IsInt()
  @IsOptional()
  orden?: number

  @IsString()
  @IsOptional()
  icono_url?: string

  @IsString()
  @IsOptional()
  color_fondo?: string
}
