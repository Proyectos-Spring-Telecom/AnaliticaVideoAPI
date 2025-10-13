import { PartialType } from '@nestjs/swagger';
import { CreateEquipoDto } from './create-equipo.dto';

export class UpdateEquipoDto extends PartialType(CreateEquipoDto) {}
