import { IsString } from 'class-validator'

export class CreatePublicacionDto {
  @IsString()
  nivel_id: string
}
