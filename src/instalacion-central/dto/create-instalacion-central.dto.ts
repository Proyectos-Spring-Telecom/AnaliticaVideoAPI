import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateInstalacionCentralDto {
     @IsOptional()
     @IsString()
     @MaxLength(255)
     @ApiProperty({
        description: 'Nombre de la instalación central',
        example: 'Sede Principal',
        required: false,
      })
    nombre?: string;

     @ApiProperty({
        description: 'Id cliente de la instalación central',
        example: 1,
      })
      @IsNumber()
      @IsNotEmpty()
    idCliente: number;

    @ApiProperty({
      description: 'Latitud de la instalación',
      example: 19.4326,
    })
    @IsNumber()
    @IsNotEmpty()
    lat: number;
    @ApiProperty({
      description: 'Longitud de la instalación',
      example: -99.1332,
    })
    @IsNumber()
    @IsNotEmpty()
   lng: number;

}
