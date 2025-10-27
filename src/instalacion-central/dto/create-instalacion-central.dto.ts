import { ApiProperty } from "@nestjs/swagger";

export class CreateInstalacionCentralDto {
     @ApiProperty({
        description: 'Id cliente de la instalación central',
        example: 'PIRAMIDE TEOPANZOLCO',
      })
    idCliente: string;

    @ApiProperty({
      description: 'Latitud de la instalación',
      example: 19.4326,
    })
    lat: number;
    @ApiProperty({
      description: 'Longitud de la instalación',
      example: -99.1332,
    })
   lng: number;

}
