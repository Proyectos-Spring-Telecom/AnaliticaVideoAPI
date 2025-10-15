import { Body, Controller, Post, Req } from '@nestjs/common';
import { IncidenciasService } from './incidencias.service';
import { ApiCrudResponse } from 'src/common/ApiResponse';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';

@Controller('incidencias')
export class IncidenciasController {
  constructor(private readonly incidenciasService: IncidenciasService) {}

  @Post()
  async create(
    @Body() createIncidenciaDto: CreateIncidenciaDto,
    @Req() req,
  ){
    const idUser = req.user.userId;
    return await this.incidenciasService.create(createIncidenciaDto, idUser);
  }
  
}
