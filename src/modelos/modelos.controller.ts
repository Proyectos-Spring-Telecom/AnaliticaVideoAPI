import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ModelosService } from './modelos.service';
import { UpdateModeloDto } from './dto/update-modelo.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { CreateCatModelosDto } from './dto/create-modelo.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('modelos')
export class ModelosController {
  constructor(private readonly modelosService: ModelosService) {}

  @Post()
  create(@Body() createModeloDto: CreateCatModelosDto,@Req() req) {
    return this.modelosService.create(createModeloDto,req.user.id);
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
  update(@Param('id') id: string, @Body() updateModeloDto: UpdateModeloDto, @Req() req) {
    return this.modelosService.update(+id, updateModeloDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.modelosService.remove(+id, req.user.id);
  }
}
