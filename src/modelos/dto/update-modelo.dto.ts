import { PartialType } from '@nestjs/swagger';
import { CreateModeloDto } from './create-modelo.dto';

export class UpdateModeloDto extends PartialType(CreateModeloDto) {}
