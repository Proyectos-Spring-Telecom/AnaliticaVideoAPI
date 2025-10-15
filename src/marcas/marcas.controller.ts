import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { MarcasService } from './marcas.service';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { CreateCatMarcaDto } from './dto/create-marca.dto';
@UseGuards(JwtAuthGuard)
@Controller('marcas')
export class MarcasController {
  constructor(private readonly marcasService: MarcasService) {}

  @Post()
  create(@Body() createMarcaDto: CreateCatMarcaDto, @Req() req) {
    return this.marcasService.create(createMarcaDto,req);
  }

  @Get()
  findAll() {
    return this.marcasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marcasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMarcaDto: UpdateMarcaDto) {
    return this.marcasService.update(+id, updateMarcaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marcasService.remove(+id);
  }
}
