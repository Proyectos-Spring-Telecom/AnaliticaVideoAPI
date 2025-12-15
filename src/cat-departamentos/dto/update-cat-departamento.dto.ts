import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCatDepartamentoDto } from './create-cat-departamento.dto';

export class UpdateCatDepartamentoDto extends PartialType(CreateCatDepartamentoDto) {
  @ApiProperty({
    description: 'Identificador único del departamento',
    example: 1,
  })
  id: number;
}

