import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateUsuarioContrasena } from './dto/update-usuario-contrasena.dto';
import { ApiCrudResponse, ApiResponseCommon } from 'src/common/ApiResponse';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdateUsuarioEstatusDto } from './dto/update-usuario-estatus.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

    @Post()
    @ApiOperation({ summary: 'Crear nuevo usuario' })
    @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    async createUsuario(
      @Body() createUsuarioDto: CreateUsuarioDto,
      @Req() req
    ): Promise<ApiCrudResponse> {
      const idUser = req.user.userId;
      return await this.usuariosService.createUsuario(createUsuarioDto, idUser);
    }
  
    // ========================================
    // 🔹 GET ROUTES - Rutas específicas primero
    // ========================================
    
    @Get('list')
    @ApiOperation({ summary: 'Obtener todos los usuarios sin paginación' })
    @ApiResponse({ status: 200, description: 'Lista completa de usuarios' })
    async findAllList(@Req() req): Promise<ApiResponseCommon> {
      const cliente = req.user.cliente;
      const rol = req.user.rol;
      return await this.usuariosService.getAllListUsuarios(+cliente, +rol);
    }

    @Get('list/cliente')
    @ApiOperation({ summary: 'Obtener usuarios por cliente específico' })
    @ApiResponse({ status: 200, description: 'Lista de usuarios del cliente' })
    @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
    async findAllListUsuarioCliente(
      @Req() req
    ): Promise<ApiResponseCommon> {
      return await this.usuariosService.getAllListUsuariosCliente(req.user.idCliente);
    }
  
    @Get(':page/:limit')
    @ApiOperation({ summary: 'Obtener usuarios con paginación' })
    @ApiResponse({ status: 200, description: 'Lista de usuarios paginada' })
    async findAll(
      @Param('page', ParseIntPipe) page: number,
      @Param('limit', ParseIntPipe) limit: number,
      @Req() req,
    ): Promise<ApiResponseCommon> {
      const cliente = req.user.cliente;
      const rol = req.user.rol;
      return await this.usuariosService.getAllUsuario(
        +cliente,
        +rol,
        page,
        limit,
      );
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Obtener usuario por ID' })
    @ApiResponse({ status: 200, description: 'Usuario encontrado' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    async findOne(@Param('id') id: number, @Req() req) {
      const cliente = req.user.cliente;
      const rol = req.user.rol;
      return this.usuariosService.getUsuarioByID(+id, +cliente, +rol);
    }
  
  
      // ========================================
  // 🔹 PUT ROUTES (actualización completa)
  // ========================================

  @Put('actualizar/contrasena/:id')
  @ApiOperation({ summary: 'Cambiar contraseña de usuario' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente' })
  @ApiResponse({ status: 400, description: 'Contraseña inválida' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateContrasena(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioContrasena: UpdateUsuarioContrasena,
    @Req() req,
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.usuariosService.updateContrasena(
      id,
      idUser,
      updateUsuarioContrasena,
    );
  }
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar información completa del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @Req() req,
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.usuariosService.updateUsuario(
      id,
      updateUsuarioDto,
      idUser,
    );
  }

  @Patch('estatus/:id')
  @ApiOperation({ summary: 'Cambiar estatus del usuario (activar/desactivar)' })
  @ApiResponse({ status: 200, description: 'Estatus actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async changeUsuarioEstatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioEstatusDto: UpdateUsuarioEstatusDto,
    @Req() req,
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.usuariosService.updateUsuarioEstatus(
      id,
      updateUsuarioEstatusDto,
      idUser,
    );
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar el usuario' })
  async deleteUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.usuariosService.deleteUsuario(id, idUser);
  }
  
}