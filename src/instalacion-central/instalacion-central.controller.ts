import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InstalacionCentralService } from './instalacion-central.service';
import { CreateInstalacionCentralDto } from './dto/create-instalacion-central.dto';
import { UpdateInstalacionCentralDto } from './dto/update-instalacion-central.dto';

@Controller('instalacion-central')
export class InstalacionCentralController {
  constructor(private readonly instalacionCentralService: InstalacionCentralService) {}

  @Post()
  create(@Body() createInstalacionCentralDto: CreateInstalacionCentralDto) {
    return this.instalacionCentralService.create(createInstalacionCentralDto);
  }

  @Get()
  findAll() {
    return this.instalacionCentralService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.instalacionCentralService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInstalacionCentralDto: UpdateInstalacionCentralDto) {
    return this.instalacionCentralService.update(+id, updateInstalacionCentralDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.instalacionCentralService.remove(+id);
  }
}
