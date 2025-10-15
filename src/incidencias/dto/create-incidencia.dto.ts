import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncidenciaDto {
  @IsEnum(['hombre', 'mujer'])
  @ApiProperty({description:'Genero de la persona'})
  genero: 'hombre' | 'mujer';

  @IsInt()
  @ApiProperty({description:'Estado de animo de la persona'})
  edad: number;

  @IsEnum(['feliz', 'neutral', 'sorprendido', 'triste', 'molesto', 'disgustado', 'asustado', 'despectivo'])
  @ApiProperty()
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
  @ApiProperty({description:'Tiempo en escena de la persona'})
  tiempoEnEscena?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({description:'Foto de la persona'})
  foto?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({description:'Foto Proceso de la persona'})
  fotoProceso?: string;

  @IsDateString()
  @ApiProperty({description:'Fecha'})
  fecha: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({description:'Id del dispositivo'})
  idDispositivo: string;
}
