import { IsString } from 'class-validator'

export class RegistrarAccesoDto {
  @IsString()
  herramienta_id: string
}
