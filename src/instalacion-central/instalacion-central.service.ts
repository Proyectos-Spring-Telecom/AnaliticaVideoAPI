import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateInstalacionCentralDto } from './dto/create-instalacion-central.dto';
import { UpdateInstalacionCentralDto } from './dto/update-instalacion-central.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InstalacionCentral } from 'src/entities/InstalacionCentral';
import { Repository } from 'typeorm';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { ApiCrudResponse, ApiResponseCommon, EstatusEnumBitcora } from 'src/common/ApiResponse';
import { log } from 'console';

@Injectable()
export class InstalacionCentralService {
  constructor(@InjectRepository(InstalacionCentral) private instalacionCentralRepository: Repository<InstalacionCentral>, private readonly bitacoraService: BitacoraService) { }

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
          nombre: `${createInstalacionCentralDto.lat} ${createInstalacionCentralDto.lng}` || '',

        },
      };
      return result;
    } catch (error) {
      throw new Error(error);
    }
  }

  async findAll() {
    try {
      const data = await this.instalacionCentralRepository.find({ relations: ['cliente', 'instalaciones'] });
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

        return {
          ...rest,
          id: Number(rest.id),
          idCliente: Number(rest.idCliente),
          nombreCliente,
          direccion,
          nombreEncargado: c?.nombreEncargado || null,
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

  async findAllPaginated(page:number, limit:number): Promise<ApiResponseCommon> {
    try {
      // Calcular desplazamiento
      const skip = (page - 1) * limit;

      // Obtener datos y total
      const [data, total] = await this.instalacionCentralRepository.findAndCount({
        relations: ['cliente', 'instalaciones'],
        skip,
        take: limit,
        order: { id: 'ASC' }, // puedes cambiar el orden si quieres
      });

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

        return {
          ...rest,
          id: Number(rest.id),
          idCliente: Number(rest.idCliente),
          nombreCliente,
          direccion,
          nombreEncargado: c?.nombreEncargado || null,
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
      const data = await this.instalacionCentralRepository.findOne({ where: { id: id }, relations: ['cliente', 'instalaciones'] });

      if (!data) {
        throw new ConflictException(`La instalacion con el id ${id} no existe`);
      }
      return data;
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
      const result: ApiCrudResponse = {
        status: 'success',
        message: 'La instalación central ha sido actualizada correctamente.',
        data: {
          id: id,
          nombre: `${updateInstalacionCentralDto.lat} ${updateInstalacionCentralDto.lng}` || '',

        },
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
          nombre: `${instalacion.lat} ${instalacion.lng}` || '',
        },
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
          nombre: `${instalacion.lat} ${instalacion.lng}` || '',
        },
      };
      return result;
    } catch (error) {

    }
  }
}
