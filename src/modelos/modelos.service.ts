import { Injectable } from '@nestjs/common';
import { CreateCatModelosDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';

@Injectable()
export class ModelosService {
  create(createModeloDto: CreateCatModelosDto) {
    return 'This action adds a new modelo';
  }

  findAll() {
    return `This action returns all modelos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} modelo`;
  }

  update(id: number, updateModeloDto: UpdateModeloDto) {
    return `This action updates a #${id} modelo`;
  }

  remove(id: number) {
    return `This action removes a #${id} modelo`;
  }
}
