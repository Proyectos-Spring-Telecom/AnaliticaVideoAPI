import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { IncidenciasService } from './incidencias.service';
import { ApiCrudResponse } from 'src/common/ApiResponse';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { ApiOperation, ApiSecurity } from '@nestjs/swagger';

@Controller('incidencias')
export class IncidenciasController {
  constructor(private readonly incidenciasService: IncidenciasService) { }

  @Post()
  @ApiOperation({ 
    summary: 'Crear nueva incidencia',
    security: []
  })
  async create(
    @Body() createIncidenciaDto: CreateIncidenciaDto,
  ) {
    return await this.incidenciasService.create(createIncidenciaDto, 1);
  }
  @Get('/hoy/:numeroSerie')
  async getIncidencias(@Param('numeroSerie') numeroSerie: string) {
    return await this.incidenciasService.getIncidencias(numeroSerie);
  }


  @Get('ultimo-hit/:numeroSerie')
  async getUltimoHit(@Param('numeroSerie') numeroSerie: string) {
    return await this.incidenciasService.findUltimoHit(numeroSerie);
  }

  @Get('rango/:numeroSerie')
  async getByRango(
    @Param('numeroSerie') numeroSerie: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return await this.incidenciasService.findByRango(numeroSerie, fechaInicio, fechaFin);
  }

  @Get('rango-paginado/:numeroSerie')
  async getByRangoPaginado(
    @Param('numeroSerie') numeroSerie: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.incidenciasService.findByRangoPaginado(
      numeroSerie,
      fechaInicio,
      fechaFin,
      Number(page),
      Number(limit),
    );
  }

    @Get('por-hora/:numeroSerie')
  async getPorHora(
    @Param('numeroSerie') numeroSerie: string,
    @Query('fecha') fecha: string
  ) {
    return await this.incidenciasService.findPorHora(numeroSerie, fecha);
  }

    @Get('por-hora-rango/:numeroSerie')
  async getPorHoraRango(
    @Param('numeroSerie') numeroSerie: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return await this.incidenciasService.findPorHoraRango(numeroSerie, fechaInicio, fechaFin);
  }
}
