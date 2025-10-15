import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCatModelosDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';
import { CatModelos } from 'src/entities/CatModelos';
import { CatMarca } from 'src/entities/CatMarcas';
import { Not, Raw, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { ApiCrudResponse, ApiResponseCommon, EstatusEnumBitcora } from 'src/common/ApiResponse';

@Injectable()
export class ModelosService {
  constructor(@InjectRepository(CatModelos) private readonly modeloRepository:Repository<CatModelos>,    private readonly bitacoraLogger: BitacoraService){}

 async create(createModeloDto: CreateCatModelosDto,idUser:number) {
    try {
      const exist = await this.modeloRepository.find({
        where: {
          nombre: Raw((alias) => `LOWER(${alias}) = LOWER(:nombre)`, { nombre: createModeloDto.nombre }),
          idProducto : createModeloDto.idProducto
        }
      });
      if(exist) throw new BadRequestException("Ya exíste un modelo con este nombre")
        const create = await this.modeloRepository.create(createModeloDto);
        const saved = await this.modeloRepository.save(create);
        const querylogger = { createModeloDto };
        await this.bitacoraLogger.logToBitacora(
          'Modelos',
          `Modelo creado correctamente con nombre: ${saved.nombre}.`,
          'CREATE',
          querylogger,
          idUser,
          1,
          EstatusEnumBitcora.SUCCESS,
        );
  
        const result: ApiCrudResponse = {
          status: 'success',
          message: 'El modelo ha sido creadoa correctamente.',
          data: {
            id: saved.id,
            nombre:
              `${saved.nombre}` || '',
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
        const [data, total] = await this.modeloRepository.findAndCount({
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
      const data = await this.modeloRepository.find();
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
      const data = await this.modeloRepository.findOne({ where: { id: id } });
      if (!data) throw new NotFoundException("Modelo no encontrada");
      return data;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async update(id: number, updateModeloDto: UpdateModeloDto, idUser:number) {
    try {
      const exist = await this.modeloRepository.findOne({
        where: {
          nombre: Raw((alias) => `LOWER(${alias}) = LOWER(:nombre)`, {
            nombre: updateModeloDto.nombre,
          }),
          id: Not(id),
        },
      });

      if (exist)
        throw new BadRequestException(
          "Ya exíste una marca con el mismo nombre"
        );

      await this.modeloRepository.update(id, updateModeloDto);
      const querylogger = { updateModeloDto };
      await this.bitacoraLogger.logToBitacora(
        "Marcas",
        `Marca actualizado correctamente con nombre: ${updateModeloDto.nombre}.`,
        "CREATE",
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.SUCCESS
      );

      const result: ApiCrudResponse = {
        status: "success",
        message: "La marca ha sido actualizado correctamente.",
        data: {
          id: id,
          nombre: `${updateModeloDto.nombre}` || "",
        },
      };
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async remove(id: number,idUser:number) {
    try {
      const marcaEliminar = await this.modeloRepository.findOne({
        where: { id: id },
      });
      if (!marcaEliminar) {
        throw new NotFoundException(
          `La marca con ID: ${id} no fue encontrado.`
        );
      }
      await this.modeloRepository.update(id, { estatus: 0 });

      const querylogger = { id: id, estatus: 0 };
      await this.bitacoraLogger.logToBitacora(
        "Marcas",
        `Se eliminó la marca con ID: ${id}.`,
        "UPDATE",
        querylogger,
        Number(idUser),
        1,
        EstatusEnumBitcora.SUCCESS
      );

      const result: ApiCrudResponse = {
        status: "success",
        message: "La marca fue eliminado correctamente.",
        data: {
          id: id,
          nombre: `${marcaEliminar.nombre} ` || "",
        },
      };
      return result;
    } catch (error) {
      const querylogger = { id: id, estatus: 0 };
      await this.bitacoraLogger.logToBitacora(
        "Marcas",
        `Se eliminó el marca con ID: ${id}.`,
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
        message: `Error al eliminar la marca con ID: ${id}.`,
        error: error.message,
      });
    }
  }
}
