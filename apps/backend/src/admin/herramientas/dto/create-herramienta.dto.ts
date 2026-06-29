import { IsInt, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateHerramientaDto {
  @IsString()
  @MinLength(2)
  nombre: string

  @IsString()
  url: string

  @IsString()
  @IsOptional()
  descripcion?: string

  @IsString()
  @IsOptional()
  icono_url?: string

  @IsInt()
  @IsOptional()
  orden?: number
}
