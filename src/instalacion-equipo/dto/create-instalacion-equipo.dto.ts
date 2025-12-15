import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateInstalacionEquipoDto {
  @ApiProperty({
    description: "Id del equipo a instalar",
    example: "EQ-123456",
  })
  @IsNumber()
  @IsNotEmpty()
  idEquipo: number;
  @ApiProperty({
    description: "Latitud de la instalación",
    example: 19.4326,
  })
  @IsNumber()
  @IsNotEmpty()
  lat: number;
  @ApiProperty({
    description: "Longitud de la instalación",
    example: -99.1332,
  })
  @IsNumber()
  @IsNotEmpty()
  lng: number;
  @ApiProperty({
    description: "ID del cliente asociado a la instalación",
    example: "123456",
  })
  @IsNumber()
  @IsNotEmpty()
  idCliente?: number;
  @ApiProperty({
    description: "ID de la instalacion central",
    example: "123456",
  })
  @IsNumber()
  @IsNotEmpty()
  idSedeCentral?: number;

  @ApiProperty({
    description: "Número de piso donde se encuentra el equipo",
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  nroPiso?: number;

  @ApiProperty({
    description: "ID del departamento donde se encuentra el equipo",
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  idDepartamento: number;
}
