import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { InstalacionCentralService } from './instalacion-central.service';
import { CreateInstalacionCentralDto } from './dto/create-instalacion-central.dto';
import { UpdateInstalacionCentralDto } from './dto/update-instalacion-central.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('instalacion-central')
export class InstalacionCentralController {
  constructor(private readonly instalacionCentralService: InstalacionCentralService) {}

  @Post()
  create(@Body() createInstalacionCentralDto: CreateInstalacionCentralDto,@Req() req:any) {
    return this.instalacionCentralService.create(createInstalacionCentralDto,req);
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
