import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { InstalacionEquipoService } from './instalacion-equipo.service';
import { CreateInstalacionEquipoDto } from './dto/create-instalacion-equipo.dto';
import { UpdateInstalacionEquipoDto } from './dto/update-instalacion-equipo.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('instalacion-equipo')
export class InstalacionEquipoController {
  constructor(private readonly instalacionEquipoService: InstalacionEquipoService) {}

  @Post()
  @ApiOperation({
    summary:'Registrar instalación equipo perteneciente a una sede'
  })
  create(@Body() createInstalacionEquipoDto: CreateInstalacionEquipoDto, @Req() req) {
    return this.instalacionEquipoService.create(createInstalacionEquipoDto,req);
  }

  @Get()
  @ApiOperation({
    summary:'Obtener instalaciónes equipos'
  })
  findAll(@Req() req) {
    const cliente = req.user?.cliente;
    const rol = req.user?.rol;
    return this.instalacionEquipoService.findAll(+cliente, +rol);
  }

  @Get(':id')
  @ApiOperation({
    summary:'Obtener instalaciónes equipos'
  })
  findOne(@Param('id') id: string) {
    return this.instalacionEquipoService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary:'Actualizar instalación equipo'
  })
  update(@Param('id') id: string, @Body() updateInstalacionEquipoDto: UpdateInstalacionEquipoDto) {
    return this.instalacionEquipoService.update(+id, updateInstalacionEquipoDto);
  }

  @Patch('/desactivar/:id')
  remove(@Param('id') id: string) {
    return this.instalacionEquipoService.remove(+id);
  }

  @Patch('/activar/:id')
  activar(@Param('id') id: string) {
    return this.instalacionEquipoService.activar(+id);
  }
}
