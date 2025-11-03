import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateInstalacionEquipoDto } from './dto/create-instalacion-equipo.dto';
import { UpdateInstalacionEquipoDto } from './dto/update-instalacion-equipo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Equipos } from 'src/entities/Equipos';
import { Repository } from 'typeorm';
import { InstalacionEquipo } from 'src/entities/InstalacionEquipo';
import { EstadoEquipoEnum } from 'src/utils/enums/EstatusEquiposEnum.enum';
import { ApiCrudResponse, EstatusEnumBitcora } from 'src/common/ApiResponse';
import { BitacoraService } from 'src/bitacora/bitacora.service';

@Injectable()
export class InstalacionEquipoService {
  constructor(@InjectRepository(Equipos) private readonly equiposRepository:Repository<Equipos>,
  @InjectRepository(InstalacionEquipo) private readonly instalacionEquipo:Repository<InstalacionEquipo>, private readonly bitacoraService: BitacoraService){}

  async create(createInstalacionEquipoDto: CreateInstalacionEquipoDto, req:any) {
     try {
      var isAvailable = await this.equiposRepository.findOne({where:{id:createInstalacionEquipoDto.idEquipo}})
      if(!isAvailable) throw new NotFoundException('Equipo no encontrado.')
      if(isAvailable?.idEstadoEquipo !== EstadoEquipoEnum.DISPONIBLE){
        throw new ConflictException('El equipo no esta disponible para ser instalado.')
      }
        const create = await this.instalacionEquipo.create(createInstalacionEquipoDto);
        const saved = await this.instalacionEquipo.save(create);
        if(saved.id > 0){
           isAvailable.idEstadoEquipo = EstadoEquipoEnum.INSTALADO;
           await this.equiposRepository.update(isAvailable.id,isAvailable);
        }
        const querylogger = { createInstalacionEquipoDto };
        const idUser = req.user.userId;
        await this.bitacoraService.logToBitacora(
          'Modelos',
          `Instalacion creada con id: ${saved.id}.`,
          'CREATE',
          querylogger,
          idUser,
          1,
          EstatusEnumBitcora.SUCCESS,
        );
        const result: ApiCrudResponse = {
          status: 'success',
          message: 'El equipo ha sido instalado correctamente.',
          data: {
            id: saved.id,
            nombre:
              `${isAvailable.numeroSerie}` || '',
          },
        };
        return result;
     } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
     }
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
