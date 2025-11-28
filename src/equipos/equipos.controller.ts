import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  @Post()
  create(@Body() createEquipoDto: CreateEquipoDto, @Req() req:any) {
    return this.equiposService.create(createEquipoDto,req.user.userId);
  }

  @Get()
  findAll(@Req() req) {
    const cliente = req.user?.cliente;
    const rol = req.user?.rol;
    return this.equiposService.findAll(+cliente, +rol);
  }
  @Get(':page/:limit')
  findAllPaginated(@Param('page', ParseIntPipe) page: number,
  @Param('limit', ParseIntPipe) limit: number, @Req() req) {
    const cliente = req.user?.cliente;
    const rol = req.user?.rol;
    return this.equiposService.findAllPaginated(page, limit, +cliente, +rol);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equiposService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEquipoDto: UpdateEquipoDto, @Req() req:any) {
    return this.equiposService.update(+id, updateEquipoDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string,@Req() req:any) {
    return this.equiposService.remove(+id, req.user.userId);
  }
}
