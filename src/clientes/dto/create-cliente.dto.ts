import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  MaxLength,
  IsEmail,
  IsIn,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateClienteDto {
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsInt({ message: "IdPadre debe ser un número entero" })
  @ApiProperty({ description: "Id del cliente padre", example: 1, required: false, type: Number })
  idPadre?: number;

  @IsString()
  @IsNotEmpty({ message: "El RFC es obligatorio" })
  @MaxLength(16, { message: "El RFC no puede exceder los 16 caracteres" })
  @ApiProperty({ description: "RFC del cliente (Registro Federal de Contribuyentes)", example: "XAXX010101000", required: true })
  rfc: string;

  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: "TipoPersona debe ser un número entero (1=Física, 2=Moral)" })
  @IsIn([1, 2], { message: "TipoPersona debe ser 1 (Física) o 2 (Moral)" })
  @ApiProperty({ description: "Tipo de persona (1=Física, 2=Moral)", example: 1, required: true, enum: [1, 2], type: Number })
  tipoPersona: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ description: "Nombre del cliente", example: "Juan", required: false })
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ description: "Apellido paterno", example: "Pérez", required: false })
  apellidoPaterno?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ description: "Apellido materno", example: "López", required: false })
  apellidoMaterno?: string;

  @IsOptional()
  @IsString()
  @MaxLength(14)
  @ApiProperty({ description: "Teléfono", example: "5551234567", required: false })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: "Debe ser un correo válido" })
  @ApiProperty({ description: "Correo electrónico", example: "cliente@correo.com", required: false })
  correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ description: "Sitio web", example: "https://miempresa.com", required: false })
  sitioWeb?: string;

  // ⚡ Dirección
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({ description: "Estado donde se encuentra el cliente", example: "Ciudad de México", required: false })
  estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({ description: "Municipio donde se encuentra el cliente", example: "Benito Juárez", required: false })
  municipio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ description: "Colonia donde se encuentra el cliente", example: "Del Valle", required: false })
  colonia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ description: "Calle del domicilio del cliente", example: "Av. Insurgentes Sur", required: false })
  calle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ description: "Entre qué calles se encuentra el domicilio", example: "Entre Félix Cuevas y Eugenia", required: false })
  entreCalles?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiProperty({ description: "Número exterior del domicilio", example: "1234", required: false })
  numeroExterior?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiProperty({ description: "Número interior del domicilio (si aplica)", example: "A", required: false })
  numeroInterior?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  @ApiProperty({ description: "Código postal del domicilio", example: "03100", required: false })
  cp?: string;

  // ⚡ Encargado
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ description: "Nombre completo del encargado del cliente", example: "María González", required: false })
  nombreEncargado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(14)
  @ApiProperty({ description: "Teléfono del encargado", example: "5559876543", required: false })
  telefonoEncargado?: string;

  @IsOptional()
  @IsEmail({}, { message: "Debe ser un correo válido" })
  @ApiProperty({ description: "Correo electrónico del encargado", example: "encargado@correo.com", required: false })
  correoEncargado?: string;

  // ⚡ Documentos - Campos de archivo para Swagger (estos campos son solo para documentación, los archivos se reciben por @UploadedFiles)
  @IsOptional()
  @ApiProperty({ 
    description: "Logotipo del cliente (PNG, JPG, JPEG o PDF, máximo 10MB). Se subirá automáticamente a S3.", 
    type: 'string',
    format: 'binary',
    required: false 
  })
  logotipo?: any;

  @IsOptional()
  @ApiProperty({ 
    description: "Constancia de situación fiscal (PNG, JPG, JPEG o PDF, máximo 10MB). Se subirá automáticamente a S3.", 
    type: 'string',
    format: 'binary',
    required: false 
  })
  constanciaSituacionFiscal?: any;

  @IsOptional()
  @ApiProperty({ 
    description: "Comprobante de domicilio (PNG, JPG, JPEG o PDF, máximo 10MB). Se subirá automáticamente a S3.", 
    type: 'string',
    format: 'binary',
    required: false 
  })
  comprobanteDomicilio?: any;

  @IsOptional()
  @ApiProperty({ 
    description: "Acta constitutiva - solo para personas morales (PNG, JPG, JPEG o PDF, máximo 10MB). Se subirá automáticamente a S3.", 
    type: 'string',
    format: 'binary',
    required: false 
  })
  actaConstitutiva?: any;

  // ⚡ Estatus
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  @IsInt({ message: "Estatus debe ser 0 ó 1" })
  @IsIn([0, 1], { message: "Solo puede ser 0 ó 1" })
  @ApiProperty({ description: "Estatus del cliente (0=Inactivo, 1=Activo)", example: 1, default: 1, required: false, type: Number })
  estatus?: number = 1;
}