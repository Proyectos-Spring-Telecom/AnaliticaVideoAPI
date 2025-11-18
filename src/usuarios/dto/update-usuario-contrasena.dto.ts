import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateUsuarioContrasena {
  @IsString()
  @IsNotEmpty({ message: 'El Password es obligatorio' })
  @ApiProperty({
    description: 'Contraseña actual del usuario',
    example: 'OldP@ssword123',
    required: true
  })
  passwordActual: string;

  @IsString()
  @IsNotEmpty({ message: 'El Password es obligatorio' })
  @MinLength(6, { message: 'El Password debe tener al menos 6 caracteres' })
  @Matches(/^(?=.*\p{L})(?=.*\d)(?=.*[@$!%*?&.])[^\s]+$/u, {
    message:
      'El Password debe contener al menos una letra (UTF-8), un número y un símbolo común (@$!%*?&.)',
  })
  @ApiProperty({
    description: 'Nueva contraseña del usuario. Debe contener al menos una letra, un número y un símbolo (@$!%*?&.)',
    example: 'NewP@ssword123',
    required: true
  })
  passwordNueva: string;

  @IsString()
  @IsNotEmpty({ message: 'El Password es obligatorio' })
  @MinLength(6, { message: 'El Password debe tener al menos 6 caracteres' })
  @Matches(/^(?=.*\p{L})(?=.*\d)(?=.*[@$!%*?&.])[^\s]+$/u, {
    message:
      'El Password debe contener al menos una letra (UTF-8), un número y un símbolo común (@$!%*?&.)',
  })
  @ApiProperty({
    description: 'Confirmación de la nueva contraseña. Debe coincidir con passwordNueva',
    example: 'NewP@ssword123',
    required: true
  })
  passwordNuevaConfirmacion: string;

}