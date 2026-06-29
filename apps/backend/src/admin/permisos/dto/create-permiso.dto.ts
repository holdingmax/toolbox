import { IsString } from 'class-validator'

export class CreatePermisoDto {
  @IsString()
  usuario_id: string

  @IsString()
  nivel_id: string
}
