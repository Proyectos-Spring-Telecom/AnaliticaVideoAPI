import { PartialType } from '@nestjs/swagger';
import { CreateCatModelosDto } from './create-modelo.dto';

export class UpdateModeloDto extends PartialType(CreateCatModelosDto) {}
