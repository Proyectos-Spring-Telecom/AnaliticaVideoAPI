import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { EstadoEquipoEnum } from 'src/utils/enums/EstatusEquiposEnum.enum';

export class CreateEquipoDto {
  @ApiProperty({
    description: 'Número de serie del equipo',
    example: 'SN-ABC123XYZ',
  })
  @IsString()
  @IsNotEmpty({ message: 'El número de serie es obligatorio' })
  @MaxLength(255, { message: 'El número de serie no puede exceder 255 caracteres' })
  numeroSerie: string;

  @ApiProperty({
    description: 'Estatus del equipo (1 Activo, 0 Inactivo)',
    example: 1,
    default: 1,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  estatus?: number = 1;

  @ApiProperty({
    description: 'Dirección IP del equipo (opcional)',
    example: '192.168.1.25',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  ip?: string;

  @ApiProperty({
    description: 'Id del cliente dueño del equipo',
    example: 101,
  })
  @IsInt()
  @IsNotEmpty({ message: 'El Id del cliente es obligatorio' })
  idCliente: number;
  
  @IsEnum(EstadoEquipoEnum)
  @IsOptional()
  idEstadoEquipo: EstadoEquipoEnum;

  @ApiProperty({
    description: 'Id del modelo del equipo',
    example: 5,
  })
  @IsInt()
  @IsNotEmpty({ message: 'El Id del modelo es obligatorio' })
  idModelo: number;
}
