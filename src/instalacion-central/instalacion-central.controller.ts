import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { InstalacionCentralService } from './instalacion-central.service';
import { CreateInstalacionCentralDto } from './dto/create-instalacion-central.dto';
import { UpdateInstalacionCentralDto } from './dto/update-instalacion-central.dto';
import { ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('instalacion-central')
export class InstalacionCentralController {
  constructor(private readonly instalacionCentralService: InstalacionCentralService) { }

  @Post()
  @ApiOperation({
    summary:'Registrar instalación central'
  })
  create(@Body() createInstalacionCentralDto: CreateInstalacionCentralDto, @Req() req: any) {
    return this.instalacionCentralService.create(createInstalacionCentralDto, req);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas las instalaciones centrales con sus instalaciones de equipos',
    description:
      'Obtiene un listado completo de todas las instalaciones centrales registradas en el sistema, incluyendo la información del cliente asociado y sus instalaciones vinculadas.',
  })
  findAll(@Req() req) {
    const cliente = req.user?.cliente;
    const rol = req.user?.rol;
    return this.instalacionCentralService.findAll(+cliente, +rol);
  }

  @Get('paginated')
  @ApiOperation({
    summary:'Lista de instalaciones centrales (cliente ubicación para grid'
  })
  findAllPaginated(@Query('page') page: number, @Query('limit') limit: number, @Req() req) {
    const cliente = req.user?.cliente;
    const rol = req.user?.rol;
    return this.instalacionCentralService.findAllPaginated(page, limit, +cliente, +rol);
  }

  @Get(':id')
  @ApiOperation({
    summary:'Obtener instalacion por id'
  })
  findOne(@Param('id') id: number) {
    console.log(id)
    return this.instalacionCentralService.findOne(+id);
  }
  @Patch('/activar/:id')
  @ApiOperation({
    summary:'Activar instalación central'
  })
  activar(@Param('id') id: string) {
    return this.instalacionCentralService.activar(+id);
  }
  @Patch(':id')
  @ApiOperation({
    summary:'Actualizar instalación central'
  })
  update(@Param('id') id: string, @Body() updateInstalacionCentralDto: UpdateInstalacionCentralDto) {
    return this.instalacionCentralService.update(+id, updateInstalacionCentralDto);
  }

  @Patch('/desactivar/:id')
  @ApiOperation({
    summary:'desactivar instalación central'
  })
  remove(@Param('id') id: string) {
    return this.instalacionCentralService.remove(+id);
  }

}
