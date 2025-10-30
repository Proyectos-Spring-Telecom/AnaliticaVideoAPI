import { Injectable } from '@nestjs/common';
import { CreateInstalacionCentralDto } from './dto/create-instalacion-central.dto';
import { UpdateInstalacionCentralDto } from './dto/update-instalacion-central.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InstalacionCentral } from 'src/entities/InstalacionCentral';
import { Repository } from 'typeorm';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { EstatusEnumBitcora } from 'src/common/ApiResponse';

@Injectable()
export class InstalacionCentralService {
  constructor(@InjectRepository(InstalacionCentral) private instalacionCentralRepository: Repository<InstalacionCentral>, private readonly bitacoraService: BitacoraService) { }

  async create(createInstalacionCentralDto: CreateInstalacionCentralDto,req) {
    try {
      const nuevaInstalacion = this.instalacionCentralRepository.create(createInstalacionCentralDto);
      const instalacionGuardada = await this.instalacionCentralRepository.save(nuevaInstalacion);
              const querylogger = { createInstalacionCentralDto };
      const idUser = Number(req.user.userId);
      await this.bitacoraService.logToBitacora(
        'Modelos',
        `Instalacion creada con id: ${instalacionGuardada.id}.`,
        'CREATE',
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.SUCCESS,
      );

      return instalacionGuardada;
    } catch (error) {
      throw new Error(error);
    }
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
