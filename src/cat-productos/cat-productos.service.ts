import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CreateCatProductoDto } from "./dto/create-cat-producto.dto";
import { UpdateCatProductoDto } from "./dto/update-cat-producto.dto";
import { CatProducto } from "src/entities/CatProducto";
import { CatMarca } from "src/entities/CatMarcas";
import { Not, Raw, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { BitacoraService } from "src/bitacora/bitacora.service";
import {
  ApiCrudResponse,
  ApiResponseCommon,
  EstatusEnumBitcora,
} from "src/common/ApiResponse";

@Injectable()
export class CatProductosService {
  constructor(
    @InjectRepository(CatProducto)
    private readonly productoRepository: Repository<CatProducto>,
    private readonly bitacoraLogger: BitacoraService
  ) {}

  async create(createCatProductoDto: CreateCatProductoDto, req: any) {
    try {
      const exist = await this.productoRepository.findOne({
        where: {
          nombre: Raw((alias) => `LOWER(${alias}) = LOWER(:nombre)`, {
            nombre: createCatProductoDto.nombre,
          }),
        },
      });
      if (exist)
        throw new BadRequestException(
          "Ya exíste un producto con el mismo nombre"
        );
      const create = await this.productoRepository.create(createCatProductoDto);
      const saved = await this.productoRepository.save(create);
      var querylogger = { createCatProductoDto };
      await this.bitacoraLogger.logToBitacora(
        "Producto",
        `Producto creado correctamente con nombre: ${saved.nombre}.`,
        "CREATE",
        querylogger,
        Number(req.user.userId),
        1,
        EstatusEnumBitcora.SUCCESS
      );

      const result: ApiCrudResponse = {
        status: "success",
        message: "El producto ha sido creado correctamente.",
        data: {
          id: saved.id,
          nombre: `${saved.nombre}` || "",
        },
      };
      return result;
    } catch (error) {
      await this.bitacoraLogger.logToBitacora(
        'Roles',
        `Se desactivo el rol con ID: ${createCatProductoDto.nombre}`,
        'UPDATE',
        createCatProductoDto,
        req.user.userId,
        1,
        EstatusEnumBitcora.ERROR,
        error.message,
      );
      throw new BadRequestException(error);
    }
  }

  async findAllPaginated(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
        const [data, total] = await this.productoRepository.findAndCount({
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
      const data = await this.productoRepository.find();
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
      const data = await this.productoRepository.findOne({ where: { id: id } });
      if(!data) throw new NotFoundException("Producto no encontrado")
      return data;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async update(id: number, updateCatProductoDto: UpdateCatProductoDto,req) {
    try {
      const exist = await this.productoRepository.findOne({
        where: {
          nombre: Raw((alias) => `LOWER(${alias}) = LOWER(:nombre)`, {
            nombre: updateCatProductoDto.nombre,
          }),
          id: Not(id),
        },
      });

      if (exist)
        throw new BadRequestException(
          "Ya exíste un producto con el mismo nombre"
        );

      await this.productoRepository.update(id,updateCatProductoDto);
      const querylogger = { updateCatProductoDto };
      await this.bitacoraLogger.logToBitacora(
        "Producto",
        `Producto actualizado correctamente con nombre: ${updateCatProductoDto.nombre}.`,
        "CREATE",
        querylogger,
        Number(req.user.userId),
        1,
        EstatusEnumBitcora.SUCCESS
      );

      const result: ApiCrudResponse = {
        status: "success",
        message: "El producto ha sido actualizado correctamente.",
        data: {
          id: id,
          nombre: `${updateCatProductoDto.nombre}` || "",
        },
      };
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async remove(id: number,idUser:number) {
    try {
      const clienteEliminar = await this.productoRepository.findOne({
        where: { id: id },
      });
      if (!clienteEliminar) {
        throw new NotFoundException(
          `El producto con ID: ${id} no fue encontrado.`,
        );
      }
      await this.productoRepository.update(id, { estatus: 0 });

      //-----Registro en la bitacora----- SUCCESS
      const querylogger = { id: id, estatus: 0 };
      await this.bitacoraLogger.logToBitacora(
        'Productos',
        `Se eliminó el producto con ID: ${id}.`,
        'UPDATE',
        querylogger,
        Number(idUser),
        1,
        EstatusEnumBitcora.SUCCESS,
      );

      //Api response
      const result: ApiCrudResponse = {
        status: 'success',
        message: 'El producto fue eliminado correctamente.',
        data: {
          id: id,
          nombre:
            `${clienteEliminar.nombre} ` ||
            '',
        },
      };
      return result;
    } catch (error) {
      //-----Registro en la bitacora----- ERROR
      const querylogger = { id: id, estatus: 0 };
      await this.bitacoraLogger.logToBitacora(
        'Productos',
        `Se eliminó el producto con ID: ${id}.`,
        'UPDATE',
        querylogger,
        Number(idUser),
        1,
        EstatusEnumBitcora.ERROR,
        error.message,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: `Error al eliminar el producto con ID: ${id}.`,
        error: error.message,
      });
    }
  }
}
