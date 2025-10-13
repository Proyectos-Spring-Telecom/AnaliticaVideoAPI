import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CatProductosService } from './cat-productos.service';
import { CreateCatProductoDto } from './dto/create-cat-producto.dto';
import { UpdateCatProductoDto } from './dto/update-cat-producto.dto';

@Controller('catProductos')
export class CatProductosController {
  constructor(private readonly catProductosService: CatProductosService) {}

  @Post()
  create(@Body() createCatProductoDto: CreateCatProductoDto) {
    return this.catProductosService.create(createCatProductoDto);
  }

  @Get()
  findAll() {
    return this.catProductosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catProductosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCatProductoDto: UpdateCatProductoDto) {
    return this.catProductosService.update(+id, updateCatProductoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catProductosService.remove(+id);
  }
}
