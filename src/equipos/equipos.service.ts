import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { Equipos } from 'src/entities/Equipos';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Raw, Repository } from 'typeorm';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { ApiCrudResponse, ApiResponseCommon, EstatusEnumBitcora } from 'src/common/ApiResponse';
import { EstadoEquipoEnum } from 'src/utils/enums/EstatusEquiposEnum.enum';

@Injectable()
export class EquiposService {
  constructor(@InjectRepository(Equipos) private readonly equiposRepository:Repository<Equipos>,    private readonly bitacoraLogger: BitacoraService){}

  async create(createEquipoDto: CreateEquipoDto,idUser:number) {
    try {
      const exist = await this.equiposRepository.findOne({
        where: {
          numeroSerie: Raw(
            (alias) => `LOWER(${alias}) = LOWER(:numeroSerie)`,
            { numeroSerie: createEquipoDto.numeroSerie }
          ),
        },
      });
      if(exist) throw new BadRequestException("Ya exíste un equipo con este número de serie")
        createEquipoDto.idEstadoEquipo = EstadoEquipoEnum.DISPONIBLE;
      const create = await this.equiposRepository.create(createEquipoDto);
        const saved = await this.equiposRepository.save(create);
        const querylogger = { createEquipoDto };
        await this.bitacoraLogger.logToBitacora(
          'Equipos',
          `Equipo creado correctamente con número de serie: ${saved.numeroSerie}.`,
          'CREATE',
          querylogger,
          idUser,
          1,
          EstatusEnumBitcora.SUCCESS,
        );
  
        const result: ApiCrudResponse = {
          status: 'success',
          message: 'El equipo ha sido creadoa correctamente.',
          data: {
            id: saved.id,
            nombre:
              `${saved.numeroSerie}` || '',
          },
        };
        return result;
    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async findAllPaginated(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
        const [data, total] = await this.equiposRepository.findAndCount({
        skip,
        take: limit,
        order: { id: 'DESC' }, 
      });
        const result: ApiResponseCommon = {
        data,
        paginated: {
          total: total,
          page,
          lastPage: Math.ceil(total / limit),
        }
      };
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findAll() {
    try {
      const data = await this.equiposRepository.find();
      const result: ApiResponseCommon = {
        data: data,
      };
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findOne(id: number) {
    try {
      const data = await this.equiposRepository.findOne({ where: { id: id } });
      if (!data) throw new NotFoundException("Equipo no encontrada");
      return data;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }


  async update(id: number, updateEquipoDto: UpdateEquipoDto, idUser:number) {
    try {
      const exist = await this.equiposRepository.findOne({
        where: {
          numeroSerie: Raw((alias) => `LOWER(${alias}) = LOWER(:numeroSerie)`, {
            numeroSerie: updateEquipoDto.numeroSerie,
          }),
          id: Not(id),
        },
      });

      if (exist)
        throw new BadRequestException(
          "Ya exíste un equipo con el mismo número de serie"
        );

      await this.equiposRepository.update(id, updateEquipoDto);
      const querylogger = { updateEquipoDto };
      await this.bitacoraLogger.logToBitacora(
        "Equipos",
        `Equipo actualizado correctamente con Número de serie: ${updateEquipoDto.numeroSerie}.`,
        "CREATE",
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.SUCCESS
      );

      const result: ApiCrudResponse = {
        status: "success",
        message: "El equipo ha sido actualizado correctamente.",
        data: {
          id: id,
          nombre: `${updateEquipoDto.numeroSerie}` || "",
        },
      };
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async remove(id: number, idUser:number) {
    try {
      const equipoEliminar = await this.equiposRepository.findOne({
        where: { id: id },
      });
      if (!equipoEliminar) {
        throw new NotFoundException(
          `El Equipo con ID: ${id} no fue encontrado.`
        );
      }
      await this.equiposRepository.update(id, { estatus: 0 });

      const querylogger = { id: id, estatus: 0 };
      await this.bitacoraLogger.logToBitacora(
        "Equipos",
        `Se eliminó el equipo con ID: ${id}.`,
        "UPDATE",
        querylogger,
        Number(idUser),
        1,
        EstatusEnumBitcora.SUCCESS
      );

      const result: ApiCrudResponse = {
        status: "success",
        message: "El equipo fue eliminado correctamente.",
        data: {
          id: id,
          nombre: `${equipoEliminar.numeroSerie} ` || "",
        },
      };
      return result;
    } catch (error) {
      const querylogger = { id: id, estatus: 0 };
      await this.bitacoraLogger.logToBitacora(
        "Equipos",
        `Se eliminó el equipo con ID: ${id}.`,
        "UPDATE",
        querylogger,
        Number(idUser),
        1,
        EstatusEnumBitcora.ERROR,
        error.message
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: `Error al eliminar el equipo con ID: ${id}.`,
        error: error.message,
      });
    }
  }
}
