import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDateString,
  MaxLength,
  MinLength,
  IsIn,
  IsArray,
  IsNumber,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El UserName es obligatorio' })
  @MaxLength(100, {
    message: 'El UserName no puede exceder los 100 caracteres',
  })
  @ApiProperty({ description: 'Nombre de usuario', example: 'usuario01' })
  userName: string;

  @IsString()
  @IsNotEmpty({ message: 'El Password es obligatorio' })
  @MinLength(6, { message: 'El Password debe tener al menos 6 caracteres' })
  @Matches(/^(?=.*\p{L})(?=.*\d)(?=.*[@$!%*?&.])[^\s]+$/u, {
    message:
      'El Password debe contener al menos una letra (UTF-8), un número y un símbolo común (@$!%*?&.)',
  })
  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'P@ssword123',
  })
  passwordHash: string;

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @IsIn([0, 1], { message: 'Solo se permite 0 o 1' })
  @ApiProperty({
    description: 'Confirmación de email (0=No, 1=Sí)',
    example: 0,
    type: Number,
  })
  emailConfirmado: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
    required: false,
  })
  nombre?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    description: 'Apellido paterno',
    example: 'Pérez',
    required: true,
  })
  apellidoPaterno: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    description: 'Apellido materno',
    example: 'López',
    required: false,
  })
  apellidoMaterno?: string;

  @IsOptional()
  @IsString()
  @MaxLength(14)
  @ApiProperty({
    description: 'Teléfono',
    example: '5512345678',
    required: false,
  })
  telefono?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ description: 'Actualización de contraseña', required: false })
  actualizacionPassword?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'URL de la foto de perfil (se genera automáticamente al subir archivo)', required: false })
  fotoPerfil?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  @IsInt()
  @IsIn([0, 1], { message: 'Solo se permite 0 o 1' })
  @ApiProperty({
    description: 'Estatus del usuario (1=Activo, 0=Inactivo)',
    example: 1,
    type: Number,
  })
  estatus?: number = 1;

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @ApiProperty({ description: 'Rol asignado', example: 2, type: Number })
  idRol: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsInt()
  @ApiProperty({ description: 'Cliente asignado', example: 5, required: false, type: Number })
  idCliente?: number;

  @IsNotEmpty()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value).map(Number);
      } catch {
        return value.split(',').map(Number);
      }
    }
    return Array.isArray(value) ? value.map(Number) : [Number(value)];
  })
  @IsNumber({}, { each: true })
  @ApiProperty({
    description: 'Array de IDs de permisos asignados al usuario',
    example: [1, 2, 3, 5],
    type: [Number],
    required: true
  })
  permisosIds: number[];
}