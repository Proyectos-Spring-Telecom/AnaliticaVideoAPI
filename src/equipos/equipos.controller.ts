import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';

@Controller('equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  @Post()
  create(@Body() createEquipoDto: CreateEquipoDto) {
    return this.equiposService.create(createEquipoDto);
  }

  @Get()
  findAll() {
    return this.equiposService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equiposService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEquipoDto: UpdateEquipoDto) {
    return this.equiposService.update(+id, updateEquipoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equiposService.remove(+id);
  }
}
