import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ModulosService } from './modulos.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { ApiCrudResponse, ApiResponseCommon } from 'src/common/ApiResponse';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { UpdateModulosEstatusDto } from './dto/update-estatus-modulo.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('modulos')
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}

  @Post()
  async create(
    @Body() createModuloDto: CreateModuloDto,
    @Req() req,
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.modulosService.create(createModuloDto, idUser);
  }

  @Get('list')
  findAllList(): Promise<ApiResponseCommon> {
    return this.modulosService.findAllList();
  }

  @Get(':page/:limit')
  findAll(
    @Param('page', ParseIntPipe) page: number,
    @Param('limit', ParseIntPipe) limit: number,
  ): Promise<ApiResponseCommon> {
    return this.modulosService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulosService.findOne(+id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModuloDto: UpdateModuloDto,
    @Req() req,
  ): Promise <ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.modulosService.update(id,updateModuloDto, idUser);
  }

  @Patch(':id/estatus')
  async updateModuloEstatus(
    @Param('id') id: string,
    @Req() req,
    @Body()updateModulosEstatusDto: UpdateModulosEstatusDto,
  ):Promise <ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.modulosService.updateModulosStatus(
      +id,
      idUser,
      updateModulosEstatusDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id',ParseIntPipe)id:number,@Req()req):Promise <ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.modulosService.deleteModulo(id,idUser);
  }
}
