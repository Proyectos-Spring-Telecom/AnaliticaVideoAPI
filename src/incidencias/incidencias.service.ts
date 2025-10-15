import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Incidencia } from "src/entities/Incidencias";
import { Repository } from "typeorm";
import { CreateIncidenciaDto } from "./dto/create-incidencia.dto";

@Injectable()
export class IncidenciasService {
  constructor(
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>
  ) {}

  async create(createIncidenciaDto:CreateIncidenciaDto,idUser:number) {
    try {
        const save = await this.incidenciaRepository.create(createIncidenciaDto);
        const created = await this.incidenciaRepository.save(save);
        return created;
    } catch (error) {
        throw new BadRequestException(error);
    }
  }
}
