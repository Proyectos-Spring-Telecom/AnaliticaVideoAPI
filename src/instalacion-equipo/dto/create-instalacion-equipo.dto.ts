import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

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
}
