import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateInstalacionEquipoDto } from './create-instalacion-equipo.dto';

export class UpdateInstalacionEquipoDto extends PartialType(CreateInstalacionEquipoDto) {
    @ApiProperty({
        description: 'Identificador único de la instalación del equipo',
        example: 1,
    })
    id:number;
}
