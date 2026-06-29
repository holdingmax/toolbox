import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator'

export class UpdateNivelDto {
  @IsString()
  @IsOptional()
  nombre?: string

  @IsString()
  @IsOptional()
  tipo?: string

  @IsString()
  @IsOptional()
  descripcion?: string

  @IsString()
  @IsOptional()
  parent_id?: string | null

  @IsInt()
  @IsOptional()
  orden?: number

  @IsString()
  @IsOptional()
  icono_url?: string

  @IsBoolean()
  @IsOptional()
  activo?: boolean
}
