import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { PermisosService } from './permisos.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { ApiCrudResponse, ApiResponseCommon } from 'src/common/ApiResponse';
import { UpdatePermisoEstatusDto } from './dto/update-permiso-estatus.dto';
import { UpdatePermisoDto } from './dto/update-permiso.dto';
import { CreatePermisoDto } from './dto/create-permiso.dto';
@UseGuards(JwtAuthGuard)
@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}
  @Post()
  async createPermioso(
    @Body() createPermiso: CreatePermisoDto,
    @Req() req,
  ): Promise<ApiCrudResponse> {
    const idUsuario = req.user.userId;
    return this.permisosService.createPermiso(createPermiso, idUsuario);
  }

  @Get(':page/:limit')
  async findAll(
    @Param('page', ParseIntPipe) page: number,
    @Param('limit', ParseIntPipe) limit: number,
  ): Promise<ApiResponseCommon> {
    return await this.permisosService.findAll(page, limit);
  }

  @Get('list')
  async findAllList(): Promise<ApiResponseCommon> {
    return await this.permisosService.findAllList();
  }

  @Get('permisosAgrupados')
  async findAllAgrupado(@Req() req): Promise<any[]> {
    const idUsuario = req.user.userId;
    const permiso =
      await this.permisosService.obtenerPermisosAgrupados(idUsuario);
    return permiso;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.permisosService.findOne(+id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermisoDto: UpdatePermisoDto,
    @Req() req,
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.permisosService.update(id, updatePermisoDto, idUser);
  }

  @Patch(':id/estatus')
  async updatePermisoEstatus(
    @Param('id') id: string,
    @Req() req,
    @Body() updatePermisoEstatusDto: UpdatePermisoEstatusDto,
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.permisosService.updateEstatus(
      +id,
      idUser,
      updatePermisoEstatusDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return this.permisosService.remove(+id, idUser);
  }
}
