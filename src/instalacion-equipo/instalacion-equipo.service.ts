import { Injectable } from '@nestjs/common';
import { CreateInstalacionEquipoDto } from './dto/create-instalacion-equipo.dto';
import { UpdateInstalacionEquipoDto } from './dto/update-instalacion-equipo.dto';

@Injectable()
export class InstalacionEquipoService {
  create(createInstalacionEquipoDto: CreateInstalacionEquipoDto) {
    return 'This action adds a new instalacionEquipo';
  }

  findAll() {
    return `This action returns all instalacionEquipo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} instalacionEquipo`;
  }

  update(id: number, updateInstalacionEquipoDto: UpdateInstalacionEquipoDto) {
    return `This action updates a #${id} instalacionEquipo`;
  }

  remove(id: number) {
    return `This action removes a #${id} instalacionEquipo`;
  }
}
