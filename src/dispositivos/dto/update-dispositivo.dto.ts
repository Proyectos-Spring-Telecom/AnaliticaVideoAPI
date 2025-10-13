import { PartialType } from '@nestjs/swagger';
import { CreateDispositivoDto } from './create-dispositivo.dto';

export class UpdateDispositivoDto extends PartialType(CreateDispositivoDto) {}
