import { IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator'

// Texto libre validado acá, no un enum de base de datos — sumar un estado
// nuevo es agregar un string a este array, sin migración.
export const ESTADOS_PROYECTO_AUTOMATIZACION = [
  'pendiente',
  'iniciado',
  'en_proceso',
  'testing',
  'finalizado',
  'pausado',
] as const

export class CreateProyectoAutomatizacionDto {
  @IsString()
  @MinLength(2)
  titulo: string

  @IsString()
  nivel_id: string

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
}
