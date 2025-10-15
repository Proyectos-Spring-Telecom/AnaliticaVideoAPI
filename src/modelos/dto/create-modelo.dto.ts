import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCatModelosDto {
  @ApiProperty({
    description: 'Nombre del modelo',
    example: 'Galaxy S24 Ultra',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del modelo es obligatorio' })
  @MaxLength(255, { message: 'El nombre no puede exceder los 255 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Estatus del modelo (1 Activo, 0 Inactivo)',
    example: 1,
    default: 1,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  estatus?: number = 1;

  @ApiProperty({
    description: 'Id de la marca asociada (CatMarca)',
    example: 3,
  })
  @IsInt()
  @IsNotEmpty({ message: 'El Id de la marca es obligatorio' })
  idMarca: number;

  @ApiProperty({
    description: 'Id del producto asociado (CatProducto)',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty({ message: 'El Id del producto es obligatorio' })
  idProducto: number;
}
