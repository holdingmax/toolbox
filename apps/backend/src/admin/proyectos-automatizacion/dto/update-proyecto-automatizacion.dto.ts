import { IsBoolean, IsDateString, IsIn, IsOptional, IsString } from 'class-validator'
import { ESTADOS_PROYECTO_AUTOMATIZACION } from './create-proyecto-automatizacion.dto'

export class UpdateProyectoAutomatizacionDto {
  @IsString()
  @IsOptional()
  titulo?: string

  @IsString()
  @IsOptional()
  nivel_id?: string

  @IsString()
  @IsIn(ESTADOS_PROYECTO_AUTOMATIZACION)
  @IsOptional()
  estado?: string

  @IsDateString()
  @IsOptional()
  fecha_inicio?: string

  @IsString()
  @IsOptional()
  notas?: string

  @IsBoolean()
  @IsOptional()
  activo?: boolean
}
