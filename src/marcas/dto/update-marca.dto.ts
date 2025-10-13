import { PartialType } from '@nestjs/swagger';
import { CreateCatMarcaDto } from './create-marca.dto';

export class UpdateMarcaDto extends PartialType(CreateCatMarcaDto) {}
