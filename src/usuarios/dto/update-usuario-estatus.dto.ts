import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsIn, IsNotEmpty } from 'class-validator';

export class UpdateUsuarioEstatusDto {
  @IsNotEmpty({ message: 'Confirmar estatus en valor de 0 ó 1'})
  @IsInt({ message: 'estatus debe ser un número entero'})
  @IsIn([0, 1], { message: 'Solo puede ser 0 ó 1'})
  @ApiProperty({
      description: 'Estatus de activación del usuario (0=Inactivo, 1=Activo)',
      example: 1,
      enum: [0, 1],
      required: true
    })
  estatus: number = 1;
}