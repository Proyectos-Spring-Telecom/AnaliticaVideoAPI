import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { CatProductosService } from './cat-productos.service';
import { CreateCatProductoDto } from './dto/create-cat-producto.dto';
import { UpdateCatProductoDto } from './dto/update-cat-producto.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('catProductos')
export class CatProductosController {
  constructor(private readonly catProductosService: CatProductosService) {}

  @Post()
  create(@Body() createCatProductoDto: CreateCatProductoDto,@Req() req:any) {
    return this.catProductosService.create(createCatProductoDto,req)
  }

  @Get()
  findAll() {
    return this.catProductosService.findAll();
  }

  @Get(':page/:limit')
  findAllPaginated(@Param('page', ParseIntPipe) page: number,
  @Param('limit', ParseIntPipe) limit: number) {
    return this.catProductosService.findAllPaginated(page,limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catProductosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCatProductoDto: UpdateCatProductoDto,@Req() req) {
    return this.catProductosService.update(+id, updateCatProductoDto, req);
  }

  @Patch('/desactivar/:id')
  remove(@Param('id') id: string, @Req() req) {
    return this.catProductosService.remove(+id,req.user.userId);
  }

  @Patch('/activar/:id')
  activar(@Param('id') id: string, @Req() req) {
    return this.catProductosService.activar(+id,req.user.userId);
  }
}
