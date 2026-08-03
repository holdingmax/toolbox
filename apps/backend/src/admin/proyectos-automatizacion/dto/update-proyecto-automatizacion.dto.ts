import { IsBoolean, IsDateString, IsIn, IsOptional, IsString } from 'class-validator'
import { ESTADOS_GENERALES_PROYECTO } from '../proyectos-automatizacion.constants'

export class UpdateProyectoAutomatizacionDto {
  @IsString()
  @IsOptional()
  titulo?: string

  @IsString()
  @IsOptional()
  nivel_id?: string

  @IsString()
  @IsIn(ESTADOS_GENERALES_PROYECTO)
  @IsOptional()
  estado_general?: string

  @IsDateString()
  @IsOptional()
  fecha_inicio?: string

  @IsString()
  @IsOptional()
  observaciones?: string

  @IsBoolean()
  @IsOptional()
  activo?: boolean
}
