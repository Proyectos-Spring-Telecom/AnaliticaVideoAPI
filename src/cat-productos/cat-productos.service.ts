import { Injectable } from '@nestjs/common';
import { CreateCatProductoDto } from './dto/create-cat-producto.dto';
import { UpdateCatProductoDto } from './dto/update-cat-producto.dto';

@Injectable()
export class CatProductosService {
  create(createCatProductoDto: CreateCatProductoDto) {
    return 'This action adds a new catProducto';
  }

  findAll() {
    return `This action returns all catProductos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} catProducto`;
  }

  update(id: number, updateCatProductoDto: UpdateCatProductoDto) {
    return `This action updates a #${id} catProducto`;
  }

  remove(id: number) {
    return `This action removes a #${id} catProducto`;
  }
}
