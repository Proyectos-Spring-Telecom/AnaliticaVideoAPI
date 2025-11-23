import {
    IsArray,
    IsDateString,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
  } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';
  import { Transform } from 'class-transformer';
  
  export class UpdateUsuarioDto {
    @IsOptional()
    @Transform(({ value }) => (value ? parseInt(value) : undefined))
    @IsInt()
    @IsIn([0, 1], { message: 'Solo se permite 0 o 1' })
    @ApiProperty({
      description: 'Confirmación de email (0=No, 1=Sí)',
      example: 0,
      type: Number,
    })
    emailConfirmado?: number;
  
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @ApiProperty({
      description: 'Nombre del usuario',
      example: 'Juan',
      required: false,
    })
    nombre?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @ApiProperty({
      description: 'Apellido paterno',
      example: 'Pérez',
      required: true,
    })
    apellidoPaterno?: string;
  
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
  
    @IsOptional()
    @Transform(({ value }) => (value ? parseInt(value) : undefined))
    @IsInt()
    @ApiProperty({ description: 'Rol asignado', example: 2, type: Number })
    idRol?: number;
  
    @IsOptional()
    @Transform(({ value }) => (value ? parseInt(value) : undefined))
    @IsInt()
    @ApiProperty({ description: 'Cliente asignado', example: 5, type: Number })
    idCliente?: number;
  
    @IsOptional()
    @IsArray()
    @Transform(({ value }) => {
      if (!value) return undefined;
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
      required: false
    })
    permisosIds?: number[];
  }