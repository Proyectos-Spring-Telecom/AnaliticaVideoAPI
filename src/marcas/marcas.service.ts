import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { UpdateMarcaDto } from "./dto/update-marca.dto";
import { CreateCatMarcaDto } from "./dto/create-marca.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { CatMarca } from "src/entities/CatMarcas";
import { Not, Raw, Repository } from "typeorm";
import {
  ApiCrudResponse,
  ApiResponseCommon,
  EstatusEnumBitcora,
} from "src/common/ApiResponse";
import { BitacoraService } from "src/bitacora/bitacora.service";

@Injectable()
export class MarcasService {
  constructor(
    @InjectRepository(CatMarca)
    private readonly marcaRepository: Repository<CatMarca>,
    private readonly bitacoraLogger: BitacoraService
  ) {}
  async create(createMarcaDto: CreateCatMarcaDto, req) {
    try {
      const exist = await this.marcaRepository.find({
        where: {
          nombre: Raw((alias) => `LOWER(${alias}) = LOWER(:nombre)`, {
            nombre: createMarcaDto.nombre,
          }),
          idProducto: createMarcaDto.idProducto,
        },
      });
      if (exist)
        throw new BadRequestException("Ya exíste una marca con este nombre");
      const create = await this.marcaRepository.create(createMarcaDto);
      const saved = await this.marcaRepository.save(create);
      const querylogger = { CreateCatMarcaDto };
      await this.bitacoraLogger.logToBitacora(
        "Marcas",
        `Marca creada correctamente con nombre: ${saved.nombre}.`,
        "CREATE",
        querylogger,
        req.user.userId,
        1,
        EstatusEnumBitcora.SUCCESS
      );

      const result: ApiCrudResponse = {
        status: "success",
        message: "La marca ha sido creadoacorrectamente.",
        data: {
          id: saved.id,
          nombre: `${saved.nombre}` || "",
        },
      };
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
  async findAllPaginated(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await this.marcaRepository.findAndCount({
        skip,
        take: limit,
        order: { id: "DESC" },
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

  async findAll() {
    try {
      const data = await this.marcaRepository.find();
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
      const data = await this.marcaRepository.findOne({ where: { id: id } });
      if (!data) throw new NotFoundException("Marca no encontrada");
      return data;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async update(id: number, updateMarcaDto: UpdateMarcaDto, idUser: number) {
    try {
      const exist = await this.marcaRepository.findOne({
        where: {
          nombre: Raw((alias) => `LOWER(${alias}) = LOWER(:nombre)`, {
            nombre: updateMarcaDto.nombre,
          }),
          id: Not(id),
        },
      });

      if (exist)
        throw new BadRequestException(
          "Ya exíste una marca con el mismo nombre"
        );

      await this.marcaRepository.update(id, updateMarcaDto);
      const querylogger = { updateMarcaDto };
      await this.bitacoraLogger.logToBitacora(
        "Marcas",
        `Marca actualizado correctamente con nombre: ${updateMarcaDto.nombre}.`,
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
          nombre: `${updateMarcaDto.nombre}` || "",
        },
      };
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async remove(id: number, idUser: number) {
    try {
      const marcaEliminar = await this.marcaRepository.findOne({
        where: { id: id },
      });
      if (!marcaEliminar) {
        throw new NotFoundException(
          `La marca con ID: ${id} no fue encontrado.`
        );
      }
      await this.marcaRepository.update(id, { estatus: 0 });

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
