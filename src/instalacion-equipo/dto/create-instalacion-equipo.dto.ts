import { ApiProperty } from "@nestjs/swagger";

export class CreateInstalacionEquipoDto {
    @ApiProperty({
        description: 'Id del equipo a instalar',
        example: 'EQ-123456',
    })
    idEquipo: string;
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
    @ApiProperty({
        description: 'ID del cliente asociado a la instalación',
        example: '123456',
    })
    idCliente?: string;
}
