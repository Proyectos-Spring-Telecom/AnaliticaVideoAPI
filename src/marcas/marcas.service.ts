import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { CreateCatMarcaDto } from './dto/create-marca.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CatMarca } from 'src/entities/CatMarcas';
import { Raw, Repository } from 'typeorm';
import { ApiCrudResponse, EstatusEnumBitcora } from 'src/common/ApiResponse';
import { BitacoraService } from 'src/bitacora/bitacora.service';

@Injectable()
export class MarcasService {
  constructor(@InjectRepository(CatMarca) private readonly marcaRepository:Repository<CatMarca>,    private readonly bitacoraLogger: BitacoraService){}
  async create(createMarcaDto: CreateCatMarcaDto,req) {
    try {
      const exist = await this.marcaRepository.find({
        where: {
          nombre: Raw((alias) => `LOWER(${alias}) = LOWER(:nombre)`, { nombre: createMarcaDto.nombre }),
          idProducto : createMarcaDto.idProducto
        }
      });
      if(exist) throw new BadRequestException("Ya exíste una marca con este nombre")
        const create = await this.marcaRepository.create(createMarcaDto);
        const saved = await this.marcaRepository.save(create);
        const querylogger = { CreateCatMarcaDto };
        await this.bitacoraLogger.logToBitacora(
          'Marca',
          `Marca creada correctamente con nombre: ${saved.nombre}.`,
          'CREATE',
          querylogger,
          req.user.id,
          1,
          EstatusEnumBitcora.SUCCESS,
        );
  
        const result: ApiCrudResponse = {
          status: 'success',
          message: 'La marca ha sido creadoacorrectamente.',
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

  findAll() {
    return `This action returns all marcas`;
  }

  findOne(id: number) {
    return `This action returns a #${id} marca`;
  }

  update(id: number, updateMarcaDto: UpdateMarcaDto) {
    return `This action updates a #${id} marca`;
  }

  remove(id: number) {
    return `This action removes a #${id} marca`;
  }
}
