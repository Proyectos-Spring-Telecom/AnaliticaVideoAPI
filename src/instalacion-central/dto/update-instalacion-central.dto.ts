import { PartialType } from '@nestjs/swagger';
import { CreateInstalacionCentralDto } from './create-instalacion-central.dto';

export class UpdateInstalacionCentralDto extends PartialType(CreateInstalacionCentralDto) {
    id:number;
}
