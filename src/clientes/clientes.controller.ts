import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { ApiCrudResponse, ApiResponseCommon } from 'src/common/ApiResponse';
import { UpdateClienteEstatusDto } from './dto/update-cliente-estatus.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}
  //Crear cliente
  @Post()
  async createCliente(@Body() createClienteDto: CreateClienteDto, @Req() req): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.clientesService.createCliente(createClienteDto, idUser);
  }
    //Obtener todos los clientes
  @Get('list')
  async getAllListClientes(@Req() req,): Promise<ApiResponseCommon> {
    const cliente = req.user.cliente;
    const idUser = req.user.userId;
    const rol = req.user.rol;
    return this.clientesService.getAllListClientes(+idUser, +cliente, +rol);
  }
  //Obtener todos los clientes con paginado
  @Get(':page/:limit')
  getAllClientes(
    @Param('page', ParseIntPipe) page: number,
    @Param('limit', ParseIntPipe) limit: number,
    @Req() req,
  ): Promise<ApiResponseCommon> {
    const cliente = req.user.cliente;
    const idUser = req.user.userId;
    const rol = req.user.rol;
    return this.clientesService.getAllClientes(+idUser, +cliente, +rol, page, limit);
  }
  
  //Obtener solo un cliente
  @Get(':id')
  getOneCliente(@Param('id') id: string, @Req() req,) {
    const cliente = req.user.cliente;
    const idUser = req.user.userId;
    const rol = req.user.rol;
    return this.clientesService.getOneCliente(+id);
  }

    //Actualizar el estatus del cliente
  @Patch('estatus/:id')
  updateEstatusClientes(
    @Param('id') id: string,
    @Req() req,
    @Body() updateClienteEstatusDto: UpdateClienteEstatusDto,
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return this.clientesService.updateClienteStatus(
      +id,
      idUser,
      updateClienteEstatusDto,
    );
  }

  //Actualizar un cliente
  @Put(':id')
  async updateCliente(
    @Param('id') id: string,
    @Req() req,
    @Body() updateClienteDto: UpdateClienteDto,
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.clientesService.updateCliente(+id, idUser, updateClienteDto);
  }

  //Eliminar Cliente
  @Delete(':id')
  async removeClientes(@Param('id') id: string, @Req() req): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.clientesService.removeCliente(+id, idUser);
  }
}
