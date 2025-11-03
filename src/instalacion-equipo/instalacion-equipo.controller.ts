import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { InstalacionEquipoService } from './instalacion-equipo.service';
import { CreateInstalacionEquipoDto } from './dto/create-instalacion-equipo.dto';
import { UpdateInstalacionEquipoDto } from './dto/update-instalacion-equipo.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('instalacion-equipo')
export class InstalacionEquipoController {
  constructor(private readonly instalacionEquipoService: InstalacionEquipoService) {}

  @Post()
  create(@Body() createInstalacionEquipoDto: CreateInstalacionEquipoDto, @Req() req) {
    return this.instalacionEquipoService.create(createInstalacionEquipoDto,req);
  }

  @Get()
  findAll() {
    return this.instalacionEquipoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.instalacionEquipoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInstalacionEquipoDto: UpdateInstalacionEquipoDto) {
    return this.instalacionEquipoService.update(+id, updateInstalacionEquipoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.instalacionEquipoService.remove(+id);
  }
}
