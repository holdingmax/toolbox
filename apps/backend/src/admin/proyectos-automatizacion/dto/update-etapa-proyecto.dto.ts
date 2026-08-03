import { IsIn } from 'class-validator'
import { ESTADOS_ETAPA } from '../proyectos-automatizacion.constants'

export class UpdateEtapaProyectoDto {
  @IsIn(ESTADOS_ETAPA)
  estado: string
}
