import { PartialType } from '@nestjs/swagger';
import { CreateCatProductoDto } from './create-cat-producto.dto';

export class UpdateCatProductoDto extends PartialType(CreateCatProductoDto) {}
