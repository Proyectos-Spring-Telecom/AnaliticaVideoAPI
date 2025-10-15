import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateIncidenciaDto {
  @IsEnum(['hombre', 'mujer'])
  genero: 'hombre' | 'mujer';

  @IsInt()
  edad: number;

  @IsEnum(['feliz', 'neutral', 'sorprendido', 'triste', 'molesto', 'disgustado', 'asustado', 'despectivo'])
  estadoAnimo:
    | 'feliz'
    | 'neutral'
    | 'sorprendido'
    | 'triste'
    | 'molesto'
    | 'disgustado'
    | 'asustado'
    | 'despectivo';

  @IsOptional()
  @IsInt()
  tiempoEnEscena?: number;

  @IsOptional()
  @IsString()
  foto?: string;

  @IsOptional()
  @IsString()
  fotoProceso?: string;

  @IsDateString()
  fecha: string;

  @IsNotEmpty()
  @IsString()
  idDispositivo: string;
}
