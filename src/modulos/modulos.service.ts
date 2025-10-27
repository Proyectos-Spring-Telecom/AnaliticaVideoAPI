import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ApiCrudResponse, ApiResponseCommon, EstatusEnumBitcora } from 'src/common/ApiResponse';
import { UpdateModulosEstatusDto } from './dto/update-estatus-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { Repository } from 'typeorm';
import { Permisos } from 'src/entities/Permisos';
import { InjectRepository } from '@nestjs/typeorm';
import { Modulos } from 'src/entities/Modulos';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { CreateModuloDto } from './dto/create-modulo.dto';

@Injectable()
export class ModulosService {
    constructor(
        @InjectRepository(Permisos)
        private readonly permisosRepository: Repository<Permisos>,
        @InjectRepository(Modulos)
        private readonly moduloRepository: Repository<Modulos>,
        private readonly bitacoraLogger: BitacoraService,
      ) {}
    
      async create(
        createModuloDto: CreateModuloDto,
        idUser: number,
      ): Promise<ApiCrudResponse> {
        try {
          const modulos = await this.moduloRepository.findOne({
            where: { nombre: createModuloDto.nombre },
          });
          if (modulos) {
            throw new BadRequestException('El modulo ya existe');
          }
          const create = await this.moduloRepository.create(createModuloDto);
          const saved = await this.moduloRepository.save(create);
    
          //-----Registro en la bitacora----- SUCCESS
          const querylogger = { createModuloDto };
          await this.bitacoraLogger.logToBitacora(
            'Modulos',
            `Se creó un modulos con nombre: ${createModuloDto.nombre}`,
            'CREATE',
            querylogger,
            idUser,
            saved.id,
            EstatusEnumBitcora.SUCCESS,
          );
    
          const idMod = saved.id;
          //Api response
          const result: ApiCrudResponse = {
            status: 'success',
            message: 'Modulo creado correctamente',
            data: {
              id: Number(idMod),
              nombre: `${saved.nombre} ${saved.descripcion} ` || '',
            },
          };
          return result;
        } catch (error) {
          //-----Registro en la bitacora----- ERROR
          const querylogger = { createModuloDto };
          await this.bitacoraLogger.logToBitacora(
            'Modulos',
            `Se creó un modulos con nombre: ${createModuloDto.nombre}`,
            'CREATE',
            querylogger,
            idUser,
            0,
            EstatusEnumBitcora.ERROR,
            error.message,
          );
          throw new BadRequestException(error);
        }
      }
    
      async findAllList(): Promise<ApiResponseCommon> {
        try {
          const modulos = await this.moduloRepository.find({
            relations: ['permisos'],
            where: { estatus: 1 },
          });
          const result: ApiResponseCommon = {
            data: modulos,
          };
          return result;
        } catch (error) {
          throw new BadRequestException(error);
        }
      }
    
      async findAll(page: number, limit: number): Promise<ApiResponseCommon> {
        try {
          const [data, total] = await this.moduloRepository.findAndCount({
            relations: ['permisos'],
            skip: (page - 1) * limit,
            take: limit,
          });
    
          const result: ApiResponseCommon = {
            data,
            paginated: {
              total: total,
              page,
              lastPage: Math.ceil(total / limit),
            },
          };
          return result;
        } catch (error) {
          throw new BadRequestException(error.message || 'Error fetching data');
        }
      }
    
      async findOne(id: number) {
        try {
          const modulo = await this.moduloRepository.findOne({
            where: { id: id },
            relations: ['permisos'],
          });
          if (!modulo) throw new NotFoundException('Módulo no encontrado');
          return { data: modulo };
        } catch (error) {
          throw new BadRequestException(error);
        }
      }
    
      async update(
        id: number,
        updateModuloDto: UpdateModuloDto,
        idUser: number,
      ): Promise<ApiCrudResponse> {
        try {
          const modulo = await this.moduloRepository.findOne({
            where: { id: id },
          });
          if (!modulo) throw new NotFoundException('Módulo no encontrado');
          await this.moduloRepository.update(id, updateModuloDto);
          const moduloResult = await this.moduloRepository.findOne({
            where: { id: id },
          });
    
          //-----Registro en la bitacora----- SUCCESS
          const querylogger = { updateModuloDto };
          await this.bitacoraLogger.logToBitacora(
            'Modulos',
            `Se creó un modulos con modulo: ${updateModuloDto.nombre}`,
            'UPDATE',
            querylogger,
            idUser,
            id,
            EstatusEnumBitcora.SUCCESS,
          );
    
          //Api response
          const result: ApiCrudResponse = {
            status: 'success',
            message: 'Modulo actualizado correctamente',
            data: {
              id: id,
              nombre: `${moduloResult?.nombre} ${moduloResult?.descripcion} ` || '',
            },
          };
          return result;
        } catch (error) {
          //-----Registro en la bitacora----- ERROR
          const querylogger = { updateModuloDto };
          await this.bitacoraLogger.logToBitacora(
            'Modulos',
            `Se creó un modulos con modulo: ${updateModuloDto.nombre}`,
            'UPDATE',
            querylogger,
            idUser,
            id,
            EstatusEnumBitcora.ERROR,
            error.message,
          );
          throw new BadRequestException(error);
        }
      }
    
      async updateModulosStatus(
        id: number,
        idUser: number,
        updateModulosEstatusDto: UpdateModulosEstatusDto,
      ): Promise<ApiCrudResponse> {
        try {
          const modulo = await this.moduloRepository.findOne({ where: { id: id } });
          if (!modulo) {
            throw new NotFoundException('Modulo no encontrado');
          }
          const estatus = updateModulosEstatusDto.estatus;
          await this.moduloRepository.update(id, { estatus: estatus });
    
          //-----Registro en la bitacora----- SUCCESS
          const querylogger = { updateModulosEstatusDto };
          await this.bitacoraLogger.logToBitacora(
            'Modulos',
            `Se actualizo el modulo con ID: ${id} a estatus: ${estatus}`,
            'UPDATE',
            querylogger,
            idUser,
            id,
            EstatusEnumBitcora.SUCCESS,
          );
    
          //Api response
          const result: ApiCrudResponse = {
            status: 'success',
            message: 'Estatus modulo actualizado correctamente',
            estatus: { estatus: estatus },
            data: {
              id: id,
              nombre: `${modulo.nombre} ${modulo.descripcion} ` || '',
            },
          };
          return result;
        } catch (error) {
          //-----Registro en la bitacora----- ERROR
          const querylogger = { updateModulosEstatusDto };
          await this.bitacoraLogger.logToBitacora(
            'Modulos',
            `Se actualizo el modulo con ID: ${id} a estatus: ${updateModulosEstatusDto.estatus}`,
            'UPDATE',
            querylogger,
            idUser,
            id,
            EstatusEnumBitcora.ERROR,
            error.message,
          );
    
          if (error instanceof HttpException) {
            throw error;
          }
          throw new InternalServerErrorException(
            `Error al cambiar estatus del modulos con id: ${id}`,
          );
        }
      }
    
      async deleteModulo(id: number, idUser: number): Promise<ApiCrudResponse> {
        try {
          const modulo = await this.moduloRepository.findOne({ where: { id: id } });
      
          if (!modulo) throw new NotFoundException('Modulo no encontrado');
          if (modulo.estatus === 1) {
            modulo.estatus = 0;
            await this.moduloRepository.update(id, modulo);
      
            const permisos = await this.permisosRepository.find({
              where: { id: id },
            });
            if (permisos.length > 0) {
              for (const permiso of permisos) {
                permiso.estatus = 0;
                await this.permisosRepository.update(permiso.id, permiso);
              }
            }
          } else {
            modulo.estatus = 1;
            await this.moduloRepository.update(id, modulo);
            const permisos = await this.permisosRepository.find({
              where: { idModulo: id },
            });
            if (permisos.length > 0) {
              for (const permiso of permisos) {
                permiso.estatus = 1;
                await this.permisosRepository.update(permiso.id, permiso);
              }
            }
          }
      
          //-----Registro en la bitacora----- SUCCESS
          const querylogger = { id: id, estatus: 0 };
          await this.bitacoraLogger.logToBitacora(
            'Modulos',
            `Se eliminó el modulos con ID: ${id}`,
            'UPDATE',
            querylogger,
            Number(idUser),
            id,
            EstatusEnumBitcora.SUCCESS,
          );
          
          //Api response
          const result: ApiCrudResponse = {
            status: 'success',
            message: 'Modulo eliminado correctamente',
            data: {
              id: id,
              nombre: `${modulo.nombre} ${modulo.descripcion} ` || '',
            },
          };
          return result;
        } catch (error) {
          //-----Registro en la bitacora----- ERROR
          const querylogger = { id: id, estatus: 0 };
          await this.bitacoraLogger.logToBitacora(
            'Modulos',
            `Se eliminó el modulos con ID: ${id}`,
            'UPDATE',
            querylogger,
            Number(idUser),
            id,
            EstatusEnumBitcora.ERROR,
            error.message,
          );
          throw new InternalServerErrorException({
            message: 'Error al eliminar modulos.',
            error: error.message,
          });
        }
      }
}
