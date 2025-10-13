import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ModelosService } from './modelos.service';
import { UpdateModeloDto } from './dto/update-modelo.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { CreateCatModelosDto } from './dto/create-modelo.dto';
@UseGuards(JwtAuthGuard)
@Controller('modelos')
export class ModelosController {
  constructor(private readonly modelosService: ModelosService) {}

  @Post()
  create(@Body() createModeloDto: CreateCatModelosDto) {
    return this.modelosService.create(createModeloDto);
  }

  @Get()
  findAll() {
    return this.modelosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modelosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateModeloDto: UpdateModeloDto) {
    return this.modelosService.update(+id, updateModeloDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modelosService.remove(+id);
  }
}
