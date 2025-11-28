import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateInstalacionCentralDto } from './dto/create-instalacion-central.dto';
import { UpdateInstalacionCentralDto } from './dto/update-instalacion-central.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InstalacionCentral } from 'src/entities/InstalacionCentral';
import { In, Repository } from 'typeorm';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { ApiCrudResponse, ApiResponseCommon, EstatusEnumBitcora } from 'src/common/ApiResponse';
import { log } from 'console';
import { getClienteHijos, getClienteHijosPag } from 'src/utils/cliente-utils';
import { Clientes } from 'src/entities/Clientes';

@Injectable()
export class InstalacionCentralService {
  constructor(
    @InjectRepository(InstalacionCentral) private instalacionCentralRepository: Repository<InstalacionCentral>,
    @InjectRepository(Clientes) private clienteRepository: Repository<Clientes>,
    private readonly bitacoraService: BitacoraService
  ) { }

  async create(createInstalacionCentralDto: CreateInstalacionCentralDto, req) {
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
      const result: ApiCrudResponse = {
        status: 'success',
        message: 'La instalación central ha sido creada correctamente.',
        data: {
          id: instalacionGuardada.id,
          nombre: createInstalacionCentralDto.nombre || `${createInstalacionCentralDto.lat} ${createInstalacionCentralDto.lng}` || '',
          nombreInstalacionCentral: instalacionGuardada.nombre || createInstalacionCentralDto.nombre || `${createInstalacionCentralDto.lat} ${createInstalacionCentralDto.lng}` || '',
        } as any,
      };
      return result;
    } catch (error) {
      throw new Error(error);
    }
  }

  async findAll(cliente?: number, rol?: number) {
    try {
      let data;

      if (rol === 1) {
        // SuperAdministrador - obtiene todas las instalaciones
        data = await this.instalacionCentralRepository.find({         
          relations: [
            'cliente', 
            'instalaciones',
            'instalaciones.cliente',
            'instalaciones.instalacionCentral',
            'instalaciones.instalacionCentral.cliente',
            'instalaciones.equipo',
            'instalaciones.equipo.modelo',
            'instalaciones.equipo.estadoEquipo',
            'instalaciones.equipo.cliente'
          ] 
        });
      } else if (cliente) {
        // Usuarios normales - solo instalaciones del cliente actual y sus hijos (sin el padre)
        const { ids, placeholders } = await getClienteHijos(this.clienteRepository, cliente);
        
        if (ids.length === 0 || !placeholders) {
          data = [];
        } else {
          data = await this.instalacionCentralRepository.find({
            where: { idCliente: In(ids) },
            relations: [
              'cliente', 
              'instalaciones',
              'instalaciones.cliente',
              'instalaciones.instalacionCentral',
              'instalaciones.instalacionCentral.cliente',
              'instalaciones.equipo',
              'instalaciones.equipo.modelo',
              'instalaciones.equipo.estadoEquipo',
              'instalaciones.equipo.cliente'
            ] 
          });
        }
      } else {
        // Sin cliente - obtener todas
        data = await this.instalacionCentralRepository.find({         
          relations: [
            'cliente', 
            'instalaciones',
            'instalaciones.cliente',
            'instalaciones.instalacionCentral',
            'instalaciones.instalacionCentral.cliente',
            'instalaciones.equipo',
            'instalaciones.equipo.modelo',
            'instalaciones.equipo.estadoEquipo',
            'instalaciones.equipo.cliente'
          ] 
        });
      }
      const mappedData = data.map(({ cliente, ...rest }) => {
        const c = cliente;

        const nombreCliente = [c?.nombre, c?.apellidoPaterno, c?.apellidoMaterno]
          .filter(Boolean)
          .join(" ");
        const direccion = [
          c?.calle && c?.numeroExterior
            ? `${c.calle} ${c.numeroExterior}`
            : c?.calle || c?.numeroExterior,
          c?.colonia,
          c?.cp,
          c?.municipio,
          c?.estado,
        ]
          .filter(Boolean)
          .join(", ");

        // Mapear las instalaciones para asegurar que el equipo completo esté incluido
        const instalacionesMapeadas = rest.instalaciones?.map((instalacion) => ({
          ...instalacion,
          equipo: instalacion.equipo ? {
            id: instalacion.equipo.id,
            numeroSerie: instalacion.equipo.numeroSerie,
            ip: instalacion.equipo.ip,
            estatus: instalacion.equipo.estatus,
            idCliente: instalacion.equipo.idCliente,
            idModelo: instalacion.equipo.idModelo,
            idEstadoEquipo: instalacion.equipo.idEstadoEquipo,
            fechaCreacion: instalacion.equipo.fechaCreacion,
            fechaActualizacion: instalacion.equipo.fechaActualizacion,
            modelo: instalacion.equipo.modelo || null,
            estadoEquipo: instalacion.equipo.estadoEquipo || null,
            cliente: instalacion.equipo.cliente || null,
          } : null,
        })) || [];

        return {
          ...rest,
          id: Number(rest.id),
          idCliente: Number(rest.idCliente),
          nombreInstalacionCentral: rest.nombre || null,
          nombreCliente,
          direccion,
          nombreEncargado: c?.nombreEncargado || null,
          instalaciones: instalacionesMapeadas,
        };
      });

      const result: ApiResponseCommon = {
        data: mappedData,
      };
      return result;
    } catch (error) {
      throw new Error(error);
    }
  }

  async findAllPaginated(page:number, limit:number, cliente?: number, rol?: number): Promise<ApiResponseCommon> {
    try {
      // Calcular desplazamiento
      const skip = (page - 1) * limit;

      let data, total;

      if (rol === 1) {
        // SuperAdministrador - obtiene todas las instalaciones
        [data, total] = await this.instalacionCentralRepository.findAndCount({
          relations: [
            'cliente', 
            'instalaciones',
            'instalaciones.cliente',
            'instalaciones.instalacionCentral',
            'instalaciones.instalacionCentral.cliente',
            'instalaciones.equipo',
            'instalaciones.equipo.modelo',
            'instalaciones.equipo.estadoEquipo',
            'instalaciones.equipo.cliente'
          ],
          skip,
          take: limit,
          order: { id: 'ASC' },
        });
      } else if (cliente) {
        // Usuarios normales - solo instalaciones del cliente actual y sus hijos (sin el padre)
        const { ids, placeholders } = await getClienteHijosPag(this.clienteRepository, cliente);
        
        if (ids.length === 0 || !placeholders) {
          data = [];
          total = 0;
        } else {
          [data, total] = await this.instalacionCentralRepository.findAndCount({
            where: { idCliente: In(ids) },
            relations: [
              'cliente', 
              'instalaciones',
              'instalaciones.cliente',
              'instalaciones.instalacionCentral',
              'instalaciones.instalacionCentral.cliente',
              'instalaciones.equipo',
              'instalaciones.equipo.modelo',
              'instalaciones.equipo.estadoEquipo',
              'instalaciones.equipo.cliente'
            ],
            skip,
            take: limit,
            order: { id: 'ASC' },
          });
        }
      } else {
        // Sin cliente - obtener todas
        [data, total] = await this.instalacionCentralRepository.findAndCount({
          relations: [
            'cliente', 
            'instalaciones',
            'instalaciones.cliente',
            'instalaciones.instalacionCentral',
            'instalaciones.instalacionCentral.cliente',
            'instalaciones.equipo',
            'instalaciones.equipo.modelo',
            'instalaciones.equipo.estadoEquipo',
            'instalaciones.equipo.cliente'
          ],
          skip,
          take: limit,
          order: { id: 'ASC' },
        });
      }

      // Mapear resultados
      const mappedData = data.map(({ cliente, ...rest }) => {
        const c = cliente;

        const nombreCliente = [c?.nombre, c?.apellidoPaterno, c?.apellidoMaterno]
          .filter(Boolean)
          .join(' ');

        const direccion = [
          c?.calle && c?.numeroExterior
            ? `${c.calle} ${c.numeroExterior}`
            : c?.calle || c?.numeroExterior,
          c?.colonia,
          c?.cp,
          c?.municipio,
          c?.estado,
        ]
          .filter(Boolean)
          .join(', ');

        // Mapear las instalaciones para asegurar que el equipo completo esté incluido
        const instalacionesMapeadas = rest.instalaciones?.map((instalacion) => ({
          ...instalacion,
          equipo: instalacion.equipo ? {
            id: instalacion.equipo.id,
            numeroSerie: instalacion.equipo.numeroSerie,
            ip: instalacion.equipo.ip,
            estatus: instalacion.equipo.estatus,
            idCliente: instalacion.equipo.idCliente,
            idModelo: instalacion.equipo.idModelo,
            idEstadoEquipo: instalacion.equipo.idEstadoEquipo,
            fechaCreacion: instalacion.equipo.fechaCreacion,
            fechaActualizacion: instalacion.equipo.fechaActualizacion,
            modelo: instalacion.equipo.modelo || null,
            estadoEquipo: instalacion.equipo.estadoEquipo || null,
            cliente: instalacion.equipo.cliente || null,
          } : null,
        })) || [];

        return {
          ...rest,
          id: Number(rest.id),
          idCliente: Number(rest.idCliente),
          nombreInstalacionCentral: rest.nombre || null,
          nombreCliente,
          direccion,
          nombreEncargado: c?.nombreEncargado || null,
          instalaciones: instalacionesMapeadas,
        };
      });

      // Calcular metadatos de paginación
      const totalPages = Math.ceil(total / limit);

      const result: ApiResponseCommon = {
        data: mappedData,
        paginated: {
          total: total,
          page,
          lastPage: totalPages,
        },
      };

      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findOne(id: number) {
    try {
      const data = await this.instalacionCentralRepository.findOne({ 
        where: { id: id }, 
        relations: [
          'cliente', 
          'instalaciones',
          'instalaciones.cliente',
          'instalaciones.instalacionCentral',
          'instalaciones.instalacionCentral.cliente',
          'instalaciones.equipo',
          'instalaciones.equipo.modelo',
          'instalaciones.equipo.estadoEquipo',
          'instalaciones.equipo.cliente'
        ] 
      });

      if (!data) {
        throw new ConflictException(`La instalacion con el id ${id} no existe`);
      }
      
      // Mapear las instalaciones para asegurar que el equipo completo esté incluido
      const instalacionesMapeadas = data.instalaciones?.map((instalacion) => ({
        ...instalacion,
        equipo: instalacion.equipo ? {
          id: instalacion.equipo.id,
          numeroSerie: instalacion.equipo.numeroSerie,
          ip: instalacion.equipo.ip,
          estatus: instalacion.equipo.estatus,
          idCliente: instalacion.equipo.idCliente,
          idModelo: instalacion.equipo.idModelo,
          idEstadoEquipo: instalacion.equipo.idEstadoEquipo,
          fechaCreacion: instalacion.equipo.fechaCreacion,
          fechaActualizacion: instalacion.equipo.fechaActualizacion,
          modelo: instalacion.equipo.modelo || null,
          estadoEquipo: instalacion.equipo.estadoEquipo || null,
          cliente: instalacion.equipo.cliente || null,
        } : null,
      })) || [];
      
      // Agregar nombreInstalacionCentral y las instalaciones mapeadas a la respuesta
      const response = {
        ...data,
        nombreInstalacionCentral: data.nombre || null,
        instalaciones: instalacionesMapeadas,
      };
      
      return response;
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      throw new Error(error);
    }
  }


  async update(id: number, updateInstalacionCentralDto: UpdateInstalacionCentralDto) {
    try {
      const instalacion = await this.instalacionCentralRepository.findOne({ where: { id: id } });
      if (!instalacion) {
        throw new ConflictException(`La instalacion con el id ${id} no existe`);
      }
      await this.instalacionCentralRepository.update(id, updateInstalacionCentralDto);
      const instalacionActualizada = await this.instalacionCentralRepository.findOne({ where: { id: id } });
      const result: ApiCrudResponse = {
        status: 'success',
        message: 'La instalación central ha sido actualizada correctamente.',
        data: {
          id: id,
          nombre: updateInstalacionCentralDto.nombre || `${updateInstalacionCentralDto.lat} ${updateInstalacionCentralDto.lng}` || '',
          nombreInstalacionCentral: instalacionActualizada?.nombre || updateInstalacionCentralDto.nombre || null,
        } as any,
      };
      return result
    } catch (error) {

    }
  }

  async remove(id: number) {
    try {
      const instalacion = await this.instalacionCentralRepository.findOne({ where: { id: id } });
      if (!instalacion) {
        throw new ConflictException(`La instalacion con el id ${id} no existe`);
      }
      instalacion.estatus = 0;
      this.instalacionCentralRepository.update(id,instalacion);
      const result: ApiCrudResponse = {
        status: 'success',
        message: 'La instalación central ha sido inhabilitada correctamente.',
        data: {
          id: id,
          nombre: instalacion.nombre || `${instalacion.lat} ${instalacion.lng}` || '',
          nombreInstalacionCentral: instalacion.nombre || null,
        } as any,
      };
      return result;
    } catch (error) {

    }
  }
    async activar(id: number) {
    try {
      const instalacion = await this.instalacionCentralRepository.findOne({ where: { id: id } });
      if (!instalacion) {
        throw new ConflictException(`La instalacion con el id ${id} no existe`);
      }
      instalacion.estatus = 1;
      this.instalacionCentralRepository.update(id,instalacion);
      const result: ApiCrudResponse = {
        status: 'success',
        message: 'La instalación central ha sido habilitada correctamente.',
        data: {
          id: id,
          nombre: instalacion.nombre || `${instalacion.lat} ${instalacion.lng}` || '',
          nombreInstalacionCentral: instalacion.nombre || null,
        } as any,
      };
      return result;
    } catch (error) {

    }
  }
}
