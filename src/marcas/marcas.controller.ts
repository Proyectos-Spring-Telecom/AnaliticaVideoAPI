import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { MarcasService } from './marcas.service';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { CreateCatMarcaDto } from './dto/create-marca.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
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
  @Get(':page/:limit')
  findAllPaginated(@Param('page', ParseIntPipe) page: number,
  @Param('limit', ParseIntPipe) limit: number) {
    return this.marcasService.findAllPaginated(page,limit);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMarcaDto: UpdateMarcaDto, @Req() req) {
    return this.marcasService.update(+id, updateMarcaDto,req.user.userId);
  }

  @Patch('/desactivar/:id')
  remove(@Param('id') id: string, @Req() req) {
    return this.marcasService.remove(+id, req.user.userId);
  }

  @Patch('/activar/:id')
  activar(@Param('id') id: string, @Req() req) {
    return this.marcasService.activar(+id, req.user.userId);
  }
}
