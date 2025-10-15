import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCatProductoDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Teléfonos',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @MaxLength(255, { message: 'El nombre no puede exceder los 255 caracteres' })
  nombre: string;
}