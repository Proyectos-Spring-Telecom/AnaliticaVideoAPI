import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCatDepartamentoDto } from './dto/create-cat-departamento.dto';
import { UpdateCatDepartamentoDto } from './dto/update-cat-departamento.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CatDepartamentos } from 'src/entities/CatDepartamentos';
import { Raw, Repository } from 'typeorm';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { ApiCrudResponse, ApiResponseCommon, EstatusEnumBitcora } from 'src/common/ApiResponse';

@Injectable()
export class CatDepartamentosService {
  constructor(
    @InjectRepository(CatDepartamentos) private readonly departamentoRepository: Repository<CatDepartamentos>,
    private readonly bitacoraService: BitacoraService
  ) {}

  async create(createCatDepartamentoDto: CreateCatDepartamentoDto, idCliente: number, idUser: number) {
    try {
      // Verificar si ya existe un departamento con el mismo nombre para el mismo cliente
      const exist = await this.departamentoRepository.findOne({
        where: {
          nombre: Raw((alias) => `LOWER(${alias}) = LOWER(:nombre)`, { nombre: createCatDepartamentoDto.nombre }),
          idCliente: idCliente,
          estatus: 1,
        } as any,
      });

      if (exist) {
        throw new ConflictException('Ya existe un departamento con este nombre para este cliente');
      }

      const nuevoDepartamento = this.departamentoRepository.create({
        ...createCatDepartamentoDto,
        idCliente: idCliente,
      });

      const departamentoGuardado = await this.departamentoRepository.save(nuevoDepartamento);

      const querylogger = { createCatDepartamentoDto, idCliente };
      await this.bitacoraService.logToBitacora(
        'CatDepartamentos',
        `Departamento creado correctamente con nombre: ${departamentoGuardado.nombre}.`,
        'CREATE',
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.SUCCESS,
      );

      const result: ApiCrudResponse = {
        status: 'success',
        message: 'El departamento ha sido creado correctamente.',
        data: {
          id: departamentoGuardado.id,
          nombre: departamentoGuardado.nombre,
        },
      };

      return result;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new BadRequestException(error);
    }
  }

  async findAll(idCliente: number) {
    try {
      const data = await this.departamentoRepository.find({
        where: { idCliente: idCliente, estatus: 1 },
        relations: ['cliente'],
        order: { nombre: 'ASC' },
      });

      const result: ApiResponseCommon = {
        data: data,
      };

      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findAllPaginated(page: number, limit: number, idCliente: number) {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await this.departamentoRepository.findAndCount({
        where: { idCliente: idCliente },
        relations: ['cliente'],
        skip,
        take: limit,
        order: { nombre: 'ASC' },
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
      throw new BadRequestException(error);
    }
  }

  async findOne(id: number, idCliente: number) {
    try {
      const departamento = await this.departamentoRepository.findOne({
        where: { id: id, idCliente: idCliente },
        relations: ['cliente'],
      });

      if (!departamento) {
        throw new NotFoundException(`El departamento con el id ${id} no existe o no pertenece a tu cliente`);
      }

      return departamento;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error);
    }
  }

  async update(id: number, updateCatDepartamentoDto: UpdateCatDepartamentoDto, idCliente: number, idUser: number) {
    try {
      const departamento = await this.departamentoRepository.findOne({
        where: { id: id, idCliente: idCliente },
      });

      if (!departamento) {
        throw new NotFoundException(`El departamento con el id ${id} no existe o no pertenece a tu cliente`);
      }

      // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
      if (updateCatDepartamentoDto.nombre && updateCatDepartamentoDto.nombre !== departamento.nombre) {
        const exist = await this.departamentoRepository.findOne({
          where: {
            nombre: Raw((alias) => `LOWER(${alias}) = LOWER(:nombre)`, { nombre: updateCatDepartamentoDto.nombre }),
            idCliente: idCliente,
            estatus: 1,
            id: Raw((alias) => `${alias} != :id`, { id: id }),
          } as any,
        });

        if (exist) {
          throw new ConflictException('Ya existe un departamento con este nombre para este cliente');
        }
      }

      await this.departamentoRepository.update(id, updateCatDepartamentoDto);

      const departamentoActualizado : any = await this.departamentoRepository.findOne({
        where: { id: id },
        relations: ['cliente'],
      });

      const querylogger = { updateCatDepartamentoDto, idCliente };
      await this.bitacoraService.logToBitacora(
        'CatDepartamentos',
        `Departamento actualizado correctamente con id: ${id}.`,
        'UPDATE',
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.SUCCESS,
      );

      const result: ApiCrudResponse = {
        status: 'success',
        message: 'El departamento ha sido actualizado correctamente.',
        data: {
          id: departamentoActualizado.id,
          nombre: departamentoActualizado.nombre,
        },
      };

      return result;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new BadRequestException(error);
    }
  }

  async remove(id: number, idCliente: number, idUser: number) {
    try {
      const departamento = await this.departamentoRepository.findOne({
        where: { id: id, idCliente: idCliente },
      });

      if (!departamento) {
        throw new NotFoundException(`El departamento con el id ${id} no existe o no pertenece a tu cliente`);
      }

      departamento.estatus = 0;
      await this.departamentoRepository.update(id, { estatus: 0 });

      const querylogger = { id, idCliente };
      await this.bitacoraService.logToBitacora(
        'CatDepartamentos',
        `Departamento desactivado correctamente con id: ${id}.`,
        'UPDATE',
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.SUCCESS,
      );

      const result: ApiCrudResponse = {
        status: 'success',
        message: 'El departamento ha sido desactivado correctamente.',
        data: {
          id: id,
          nombre: departamento.nombre,
        },
      };

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error);
    }
  }

  async activar(id: number, idCliente: number, idUser: number) {
    try {
      const departamento = await this.departamentoRepository.findOne({
        where: { id: id, idCliente: idCliente },
      });

      if (!departamento) {
        throw new NotFoundException(`El departamento con el id ${id} no existe o no pertenece a tu cliente`);
      }

      await this.departamentoRepository.update(id, { estatus: 1 });

      const querylogger = { id, idCliente };
      await this.bitacoraService.logToBitacora(
        'CatDepartamentos',
        `Departamento activado correctamente con id: ${id}.`,
        'UPDATE',
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.SUCCESS,
      );

      const result: ApiCrudResponse = {
        status: 'success',
        message: 'El departamento ha sido activado correctamente.',
        data: {
          id: id,
          nombre: departamento.nombre,
        },
      };

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error);
    }
  }
}
