import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  @Post()
  create(@Body() createEquipoDto: CreateEquipoDto, @Req() req:any) {
    return this.equiposService.create(createEquipoDto,req.user.id);
  }

  @Get()
  findAll() {
    return this.equiposService.findAll();
  }
  @Get(':page/:limit')
  findAllPaginated(@Param('page', ParseIntPipe) page: number,
  @Param('limit', ParseIntPipe) limit: number) {
    return this.equiposService.findAllPaginated(page,limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equiposService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEquipoDto: UpdateEquipoDto, @Req() req:any) {
    return this.equiposService.update(+id, updateEquipoDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string,@Req() req:any) {
    return this.equiposService.remove(+id, req.user.id);
  }
}
