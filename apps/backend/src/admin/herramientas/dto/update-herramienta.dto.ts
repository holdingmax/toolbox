import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator'

export class UpdateHerramientaDto {
  @IsString()
  @IsOptional()
  nombre?: string

  @IsString()
  @IsOptional()
  url?: string

  @IsString()
  @IsOptional()
  descripcion?: string

  @IsString()
  @IsOptional()
  icono_url?: string

  @IsInt()
  @IsOptional()
  orden?: number

  @IsBoolean()
  @IsOptional()
  activo?: boolean
}
