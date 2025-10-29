import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { IncidenciasService } from './incidencias.service';
import { ApiCrudResponse } from 'src/common/ApiResponse';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';

@Controller('incidencias')
export class IncidenciasController {
  constructor(private readonly incidenciasService: IncidenciasService) { }

  @Post()
  async create(
    @Body() createIncidenciaDto: CreateIncidenciaDto,
  ) {
    return await this.incidenciasService.create(createIncidenciaDto, 1);
  }
  @Get('/hoy')
  async getIncidencias() {
    return await this.incidenciasService.getIncidencias();
  }


  @Get('ultimo-hit')
  async getUltimoHit() {
    return await this.incidenciasService.findUltimoHit();
  }

  @Get('rango')
  async getByRango(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return await this.incidenciasService.findByRango(fechaInicio, fechaFin);
  }

  @Get('rango-paginado')
  async getByRangoPaginado(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.incidenciasService.findByRangoPaginado(
      fechaInicio,
      fechaFin,
      Number(page),
      Number(limit),
    );
  }

    @Get('por-hora')
  async getPorHora(@Query('fecha') fecha: string) {
    return await this.incidenciasService.findPorHora(fecha);
  }

    @Get('por-hora-rango')
  async getPorHoraRango(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return await this.incidenciasService.findPorHoraRango(fechaInicio, fechaFin);
  }
}
