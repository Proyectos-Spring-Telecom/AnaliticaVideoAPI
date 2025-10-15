import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCatMarcaDto {
  @ApiProperty({
    description: 'Nombre de la marca',
    example: 'Samsung',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la marca es obligatorio' })
  @MaxLength(255, { message: 'El nombre no puede exceder los 255 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Estatus de la marca (1 Activo, 0 Inactivo)',
    example: 1,
    default: 1,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  estatus?: number = 1;

  @ApiProperty({
    description: 'Relación con el Id del producto (CatProducto)',
    example: 3,
    required: false,
  })
  @IsInt()
  @IsOptional()
  idProducto?: number;
}