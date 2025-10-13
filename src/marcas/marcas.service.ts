import { Injectable } from '@nestjs/common';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { CreateCatMarcaDto } from './dto/create-marca.dto';

@Injectable()
export class MarcasService {
  create(createMarcaDto: CreateCatMarcaDto) {
    return 'This action adds a new marca';
  }

  findAll() {
    return `This action returns all marcas`;
  }

  findOne(id: number) {
    return `This action returns a #${id} marca`;
  }

  update(id: number, updateMarcaDto: UpdateMarcaDto) {
    return `This action updates a #${id} marca`;
  }

  remove(id: number) {
    return `This action removes a #${id} marca`;
  }
}
