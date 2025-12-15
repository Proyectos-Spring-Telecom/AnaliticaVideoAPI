import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { CatDepartamentosService } from './cat-departamentos.service';
import { CreateCatDepartamentoDto } from './dto/create-cat-departamento.dto';
import { UpdateCatDepartamentoDto } from './dto/update-cat-departamento.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('cat-departamentos')
export class CatDepartamentosController {
  constructor(private readonly catDepartamentosService: CatDepartamentosService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo departamento',
    description: 'Crea un nuevo departamento asociado al cliente del usuario autenticado',
  })
  create(@Body() createCatDepartamentoDto: CreateCatDepartamentoDto, @Req() req) {
    const idCliente = req.user?.cliente;
    const idUser = req.user?.userId;
    return this.catDepartamentosService.create(createCatDepartamentoDto, +idCliente, +idUser);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los departamentos',
    description: 'Obtiene todos los departamentos activos del cliente del usuario autenticado',
  })
  findAll(@Req() req) {
    const idCliente = req.user?.cliente;
    return this.catDepartamentosService.findAll(+idCliente);
  }

  @Get('paginated')
  @ApiOperation({
    summary: 'Listar departamentos paginados',
    description: 'Obtiene los departamentos activos del cliente del usuario autenticado con paginación',
  })
  findAllPaginated(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Req() req,
  ) {
    const idCliente = req.user?.cliente;
    return this.catDepartamentosService.findAllPaginated(page, limit, +idCliente);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un departamento por ID',
    description: 'Obtiene un departamento específico por su ID, validando que pertenezca al cliente del usuario',
  })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const idCliente = req.user?.cliente;
    return this.catDepartamentosService.findOne(id, +idCliente);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un departamento',
    description: 'Actualiza los datos de un departamento, validando que pertenezca al cliente del usuario',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCatDepartamentoDto: UpdateCatDepartamentoDto,
    @Req() req,
  ) {
    const idCliente = req.user?.cliente;
    const idUser = req.user?.userId;
    return this.catDepartamentosService.update(id, updateCatDepartamentoDto, +idCliente, +idUser);
  }

  @Patch('/desactivar/:id')
  @ApiOperation({
    summary: 'Desactivar un departamento',
    description: 'Desactiva un departamento cambiando su estatus a 0',
  })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const idCliente = req.user?.cliente;
    const idUser = req.user?.userId;
    return this.catDepartamentosService.remove(id, +idCliente, +idUser);
  }

  @Patch('/activar/:id')
  @ApiOperation({
    summary: 'Activar un departamento',
    description: 'Activa un departamento cambiando su estatus a 1',
  })
  activar(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const idCliente = req.user?.cliente;
    const idUser = req.user?.userId;
    return this.catDepartamentosService.activar(id, +idCliente, +idUser);
  }
}
