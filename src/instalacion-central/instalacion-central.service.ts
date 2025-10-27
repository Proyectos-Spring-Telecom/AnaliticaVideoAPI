import { Injectable } from '@nestjs/common';
import { CreateInstalacionCentralDto } from './dto/create-instalacion-central.dto';
import { UpdateInstalacionCentralDto } from './dto/update-instalacion-central.dto';

@Injectable()
export class InstalacionCentralService {
  create(createInstalacionCentralDto: CreateInstalacionCentralDto) {
    return 'This action adds a new instalacionCentral';
  }

  findAll() {
    return `This action returns all instalacionCentral`;
  }

  findOne(id: number) {
    return `This action returns a #${id} instalacionCentral`;
  }

  update(id: number, updateInstalacionCentralDto: UpdateInstalacionCentralDto) {
    return `This action updates a #${id} instalacionCentral`;
  }

  remove(id: number) {
    return `This action removes a #${id} instalacionCentral`;
  }
}
