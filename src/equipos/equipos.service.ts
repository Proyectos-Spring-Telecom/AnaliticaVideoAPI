import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { Equipos } from 'src/entities/Equipos';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Raw, Repository } from 'typeorm';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { ApiCrudResponse, ApiResponseCommon, EstatusEnumBitcora } from 'src/common/ApiResponse';
import { EstadoEquipoEnum } from 'src/utils/enums/EstatusEquiposEnum.enum';
import { getClienteHijos, getClienteHijosPag } from 'src/utils/cliente-utils';
import { Clientes } from 'src/entities/Clientes';

@Injectable()
export class EquiposService {
  constructor(
    @InjectRepository(Equipos) private readonly equiposRepository:Repository<Equipos>,
    @InjectRepository(Clientes) private readonly clienteRepository:Repository<Clientes>,
    private readonly bitacoraLogger: BitacoraService
  ){}

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

  async findAllPaginated(page: number, limit: number, cliente?: number, rol?: number) {
    try {
      const skip = (page - 1) * limit;
      let data, total;

      if (rol === 1) {
        // SuperAdministrador - obtiene todos los equipos
        [data, total] = await this.equiposRepository.findAndCount({
          skip,
          take: limit,
          relations:['estadoEquipo','modelo','cliente'],
          order: { id: 'DESC' }, 
        });
      } else if (cliente) {
        // Usuarios normales - solo equipos del cliente actual y sus hijos (sin el padre)
        const { ids, placeholders } = await getClienteHijosPag(this.clienteRepository, cliente);
        
        if (ids.length === 0 || !placeholders) {
          data = [];
          total = 0;
        } else {
          const equipos = await this.equiposRepository.query(
            `
SELECT e.*
FROM Equipos e
WHERE e.IdCliente IN (${placeholders})
ORDER BY e.Id DESC
LIMIT ? OFFSET ?;
            `,
            [...ids, limit, skip],
          );

          const totalResult = await this.equiposRepository.query(
            `
SELECT COUNT(*) AS total
FROM Equipos e
WHERE e.IdCliente IN (${placeholders});
            `,
            [...ids],
          );

          total = Number(totalResult[0]?.total || 0);
          
          // Obtener equipos completos con relaciones
          const equiposIds = equipos.map((e: any) => e.Id);
          if (equiposIds.length > 0) {
            data = await this.equiposRepository.find({
              where: { id: In(equiposIds) },
              relations:['estadoEquipo','modelo','cliente'],
              order: { id: 'DESC' },
            });
          } else {
            data = [];
          }
        }
      } else {
        // Sin cliente - obtener todos
        [data, total] = await this.equiposRepository.findAndCount({
          skip,
          take: limit,
          relations:['estadoEquipo','modelo','cliente'],
          order: { id: 'DESC' }, 
        });
      }

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

  async findAll(cliente?: number, rol?: number) {
    try {
      let data;

      if (rol === 1) {
        // SuperAdministrador - obtiene todos los equipos
        data = await this.equiposRepository.find({relations:['cliente','modelo']});
      } else if (cliente) {
        // Usuarios normales - solo equipos del cliente actual y sus hijos (sin el padre)
        const { ids, placeholders } = await getClienteHijos(this.clienteRepository, cliente);
        
        if (ids.length === 0 || !placeholders) {
          data = [];
        } else {
          const equipos = await this.equiposRepository.query(
            `
SELECT e.Id
FROM Equipos e
WHERE e.IdCliente IN (${placeholders});
            `,
            [...ids],
          );

          const equiposIds = equipos.map((e: any) => e.Id);
          if (equiposIds.length > 0) {
            data = await this.equiposRepository.find({
              where: { id: In(equiposIds) },
              relations:['cliente','modelo'],
            });
          } else {
            data = [];
          }
        }
      } else {
        // Sin cliente - obtener todos
        data = await this.equiposRepository.find({relations:['cliente','modelo']});
      }

      const result: ApiResponseCommon = {
        data: data,
      };
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findAllDisponibles(cliente?: number, rol?: number) {
    try {
      let data;

      if (rol === 1) {
        // SuperAdministrador - obtiene todos los equipos disponibles
        data = await this.equiposRepository.find({
          where: { idEstadoEquipo: EstadoEquipoEnum.DISPONIBLE },
          relations:['cliente','modelo','estadoEquipo']
        });
      } else if (cliente) {
        // Usuarios normales - solo equipos disponibles del cliente actual y sus hijos (sin el padre)
        const { ids, placeholders } = await getClienteHijos(this.clienteRepository, cliente);
        
        if (ids.length === 0 || !placeholders) {
          data = [];
        } else {
          const equipos = await this.equiposRepository.query(
            `
SELECT e.Id
FROM Equipos e
WHERE e.IdCliente IN (${placeholders})
  AND e.IdEstadoEquipo = ?;
            `,
            [...ids, EstadoEquipoEnum.DISPONIBLE],
          );

          const equiposIds = equipos.map((e: any) => e.Id);
          if (equiposIds.length > 0) {
            data = await this.equiposRepository.find({
              where: { id: In(equiposIds) },
              relations:['cliente','modelo','estadoEquipo'],
            });
          } else {
            data = [];
          }
        }
      } else {
        // Sin cliente - obtener todos los disponibles
        data = await this.equiposRepository.find({
          where: { idEstadoEquipo: EstadoEquipoEnum.DISPONIBLE },
          relations:['cliente','modelo','estadoEquipo']
        });
      }

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
