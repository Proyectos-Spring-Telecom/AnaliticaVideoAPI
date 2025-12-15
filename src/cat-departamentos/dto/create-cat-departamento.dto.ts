import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCatDepartamentoDto {
  @ApiProperty({
    description: 'Nombre del departamento',
    example: 'Recursos Humanos',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del departamento es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede exceder los 150 caracteres' })
  nombre: string;
}

