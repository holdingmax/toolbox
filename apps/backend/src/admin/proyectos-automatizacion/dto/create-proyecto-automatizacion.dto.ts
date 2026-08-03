import { IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator'
import { ESTADOS_GENERALES_PROYECTO } from '../proyectos-automatizacion.constants'

export class CreateProyectoAutomatizacionDto {
  @IsString()
  @MinLength(2)
  titulo: string

  @IsString()
  nivel_id: string

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
}
