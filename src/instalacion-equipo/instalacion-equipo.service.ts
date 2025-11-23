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
import { InstalacionCentral } from 'src/entities/InstalacionCentral';

@Injectable()
export class InstalacionEquipoService {
  constructor(@InjectRepository(InstalacionCentral) private readonly instalacionCentral:Repository<InstalacionCentral>, @InjectRepository(Equipos) private readonly equiposRepository:Repository<Equipos>,
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
      console.log(error)
      if (error instanceof HttpException) {
        throw error;
      }
     }
  }

  async findAll() {
    try {
       const data = await this.instalacionEquipo.find({relations:['equipo','instalacionCentral','instalacionCentral.cliente','equipo.modelo','equipo.estadoEquipo']})
       // Agregar nombreInstalacionCentral a cada elemento
       const mappedData = data.map((item) => ({
         ...item,
         instalacionCentral: item.instalacionCentral ? {
           ...item.instalacionCentral,
           nombreInstalacionCentral: item.instalacionCentral.nombre || null,
         } : null,
       }));
       return mappedData;
    } catch (error) {
      
    }
  }

  async findOne(id: number) {
    try {
      const instalacion = await this.instalacionEquipo.findOne({
        where:{id:id},
        relations:['equipo','instalacionCentral','instalacionCentral.cliente','equipo.modelo','equipo.estadoEquipo']
      })
      if(!instalacion) throw new NotFoundException('No se ha encontrado la instalacion buscada')
      
      // Agregar nombreInstalacionCentral a la respuesta
      const response = {
        ...instalacion,
        instalacionCentral: instalacion.instalacionCentral ? {
          ...instalacion.instalacionCentral,
          nombreInstalacionCentral: instalacion.instalacionCentral.nombre || null,
        } : null,
      };
      
      return response;
    } catch (error) {
      throw new error;
    }
  }

  async update(id: number, updateInstalacionEquipoDto: UpdateInstalacionEquipoDto) {
    try {
      const instalacion = await this.instalacionEquipo.findOne({ where: { id: id } });
      if (!instalacion) {
        throw new ConflictException(`La instalacion con el id ${id} no existe`);
      }
      await this.instalacionEquipo.update(id, updateInstalacionEquipoDto);
      const result: ApiCrudResponse = {
        status: 'success',
        message: 'La instalación del equipo ha sido actualizada correctamente.',
        data: {
          id: id,
          nombre: `${updateInstalacionEquipoDto.lat} ${updateInstalacionEquipoDto.lng}` || '',

        },
      };
      return result
    } catch (error) {

    }
  }

  async remove(id: number) {
    try {
      const instalacion = await this.instalacionEquipo.findOne({where:{id:id}})
      if(!instalacion) throw new NotFoundException('No se ha encontrado la instalacion buscada')
       instalacion.estatus = 0;
       const update = await this.instalacionEquipo.update(id,instalacion);
       return update;
    } catch (error) {
      throw new error;
    }
  }

  async activar(id: number) {
    try {
      const instalacion = await this.instalacionEquipo.findOne({where:{id:id}})
      if(!instalacion) throw new NotFoundException('No se ha encontrado la instalacion buscada')
       instalacion.estatus = 1;
       const update = await this.instalacionEquipo.update(id,instalacion);
       return update;
    } catch (error) {
      throw new error;
    }
  }
}
