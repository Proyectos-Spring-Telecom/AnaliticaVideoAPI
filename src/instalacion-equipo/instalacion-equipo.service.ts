import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateInstalacionEquipoDto } from './dto/create-instalacion-equipo.dto';
import { UpdateInstalacionEquipoDto } from './dto/update-instalacion-equipo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Equipos } from 'src/entities/Equipos';
import { In, Repository } from 'typeorm';
import { InstalacionEquipo } from 'src/entities/InstalacionEquipo';
import { EstadoEquipoEnum } from 'src/utils/enums/EstatusEquiposEnum.enum';
import { ApiCrudResponse, EstatusEnumBitcora } from 'src/common/ApiResponse';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { InstalacionCentral } from 'src/entities/InstalacionCentral';
import { getClienteHijos } from 'src/utils/cliente-utils';
import { Clientes } from 'src/entities/Clientes';

@Injectable()
export class InstalacionEquipoService {
  constructor(
    @InjectRepository(InstalacionCentral) private readonly instalacionCentral:Repository<InstalacionCentral>,
    @InjectRepository(Equipos) private readonly equiposRepository:Repository<Equipos>,
    @InjectRepository(InstalacionEquipo) private readonly instalacionEquipo:Repository<InstalacionEquipo>,
    @InjectRepository(Clientes) private readonly clienteRepository:Repository<Clientes>,
    private readonly bitacoraService: BitacoraService
  ){}

  async create(createInstalacionEquipoDto: CreateInstalacionEquipoDto, req:any) {
     try {
      var isAvailable = await this.equiposRepository.findOne({
        where:{id:createInstalacionEquipoDto.idEquipo},
        relations:['modelo','estadoEquipo','cliente']
      })
      if(!isAvailable) throw new NotFoundException('Equipo no encontrado.')
      if(isAvailable?.idEstadoEquipo !== EstadoEquipoEnum.DISPONIBLE){
        throw new ConflictException('El equipo no esta disponible para ser instalado.')
      }
        const create = await this.instalacionEquipo.create(createInstalacionEquipoDto);
        const saved = await this.instalacionEquipo.save(create);
        if(saved.id > 0){
           // Actualizar el estatus del equipo a INSTALADO para que no se pueda volver a instalar
           await this.equiposRepository.update(
             isAvailable.id,
             { idEstadoEquipo: EstadoEquipoEnum.INSTALADO }
           );
        }
        
        // Obtener la instalación completa con relaciones
        const instalacionCompleta = await this.instalacionEquipo.findOne({
          where: { id: saved.id },
          relations:['equipo','instalacionCentral','instalacionCentral.cliente','equipo.modelo','equipo.estadoEquipo','equipo.cliente']
        });
        
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
        const result = {
          status: 'success',
          message: 'El equipo ha sido instalado correctamente.',
          data: {
            id: saved.id,
            nombre: `${isAvailable.numeroSerie}` || '',
            equipo: instalacionCompleta?.equipo || null,
            instalacionCentral: instalacionCompleta?.instalacionCentral || null,
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

  async findAll(cliente?: number, rol?: number) {
    try {
      let data;

      if (rol === 1) {
        // SuperAdministrador - obtiene todas las instalaciones
        data = await this.instalacionEquipo.find({
          relations:['equipo','instalacionCentral','instalacionCentral.cliente','equipo.modelo','equipo.estadoEquipo','equipo.cliente']
        });
      } else if (cliente) {
        // Usuarios normales - solo instalaciones del cliente actual y sus hijos (sin el padre)
        const { ids, placeholders } = await getClienteHijos(this.clienteRepository, cliente);
        
        if (ids.length === 0 || !placeholders) {
          data = [];
        } else {
          // Filtrar por idCliente de la instalación O por idCliente del equipo relacionado
          const instalaciones = await this.instalacionEquipo.query(
            `
SELECT DISTINCT ie.Id
FROM InstalacionEquipo ie
LEFT JOIN Equipos e ON ie.IdEquipo = e.Id
WHERE ie.IdCliente IN (${placeholders})
   OR e.IdCliente IN (${placeholders});
            `,
            [...ids, ...ids],
          );

          const instalacionesIds = instalaciones.map((ie: any) => ie.Id);
          if (instalacionesIds.length > 0) {
            data = await this.instalacionEquipo.find({
              where: { id: In(instalacionesIds) },
              relations:['equipo','instalacionCentral','instalacionCentral.cliente','equipo.modelo','equipo.estadoEquipo','equipo.cliente']
            });
          } else {
            data = [];
          }
        }
      } else {
        // Sin cliente - obtener todas
        data = await this.instalacionEquipo.find({
          relations:['equipo','instalacionCentral','instalacionCentral.cliente','equipo.modelo','equipo.estadoEquipo','equipo.cliente']
        });
      }
       
       // Mapear los datos asegurando que el equipo completo esté incluido
       const mappedData = data.map((item) => {
         const result: any = {
           id: item.id,
           idEquipo: item.idEquipo,
           lat: item.lat,
           lng: item.lng,
           estatus: item.estatus,
           fhRegistro: item.fhRegistro,
           fechaActualizacion: item.fechaActualizacion,
           idCliente: item.idCliente,
           idSedeCentral: item.idSedeCentral,
         };
         
         // Incluir equipo completo con todas sus propiedades
         if (item.equipo) {
           result.equipo = {
             id: item.equipo.id,
             numeroSerie: item.equipo.numeroSerie,
             ip: item.equipo.ip,
             estatus: item.equipo.estatus,
             idCliente: item.equipo.idCliente,
             idModelo: item.equipo.idModelo,
             idEstadoEquipo: item.equipo.idEstadoEquipo,
             fechaCreacion: item.equipo.fechaCreacion,
             fechaActualizacion: item.equipo.fechaActualizacion,
             modelo: item.equipo.modelo || null,
             estadoEquipo: item.equipo.estadoEquipo || null,
             cliente: item.equipo.cliente || null,
           };
         } else {
           result.equipo = null;
         }
         
         // Incluir instalacionCentral
         if (item.instalacionCentral) {
           result.instalacionCentral = {
             ...item.instalacionCentral,
             nombreInstalacionCentral: item.instalacionCentral.nombre || null,
           };
         } else {
           result.instalacionCentral = null;
         }
         
         // Incluir cliente si existe
         if (item.cliente) {
           result.cliente = item.cliente;
         }
         
         return result;
       });
       
       return mappedData;
    } catch (error) {
      console.error('Error en findAll:', error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const instalacion = await this.instalacionEquipo.findOne({
        where:{id:id},
        relations:['equipo','instalacionCentral','instalacionCentral.cliente','equipo.modelo','equipo.estadoEquipo','equipo.cliente']
      })
      if(!instalacion) throw new NotFoundException('No se ha encontrado la instalacion buscada')
      
      // Agregar nombreInstalacionCentral y asegurar que el equipo completo esté incluido
      const response = {
        ...instalacion,
        equipo: instalacion.equipo ? {
          ...instalacion.equipo,
        } : null,
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
      const instalacion = await this.instalacionEquipo.findOne({ 
        where: { id: id },
        relations:['equipo','instalacionCentral','equipo.modelo','equipo.estadoEquipo','equipo.cliente']
      });
      if (!instalacion) {
        throw new ConflictException(`La instalacion con el id ${id} no existe`);
      }
      await this.instalacionEquipo.update(id, updateInstalacionEquipoDto);
      
      // Obtener la instalación actualizada con todas las relaciones
      const instalacionActualizada = await this.instalacionEquipo.findOne({
        where: { id: id },
        relations:['equipo','instalacionCentral','instalacionCentral.cliente','equipo.modelo','equipo.estadoEquipo','equipo.cliente']
      });
      
      const result = {
        status: 'success',
        message: 'La instalación del equipo ha sido actualizada correctamente.',
        data: {
          id: id,
          nombre: `${updateInstalacionEquipoDto.lat} ${updateInstalacionEquipoDto.lng}` || '',
          equipo: instalacionActualizada?.equipo || null,
          instalacionCentral: instalacionActualizada?.instalacionCentral || null,
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
