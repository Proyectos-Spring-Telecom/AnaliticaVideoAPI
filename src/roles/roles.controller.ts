import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { ApiCrudResponse, ApiResponseCommon } from 'src/common/ApiResponse';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRolEstatusDto } from './dto/update-rol-estatus.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}
   @Post()
  create(@Body() createRoleDto: CreateRolDto, @Req() req) {
    const idUser = req.user.userId;
    const cliente = req.user.cliente;
    const rol = req.user.rol;
    return this.rolesService.create(idUser, createRoleDto);
  }

  @Get(':page/:limit')
  async findAll(
    @Param('page', ParseIntPipe) page: number,
    @Param('limit', ParseIntPipe) limit: number,
    @Req() req
  ): Promise<ApiResponseCommon> {
    const idUser = req.user.userId;
    const cliente = req.user.cliente;
    const rol = req.user.rol;
    return await this.rolesService.findAll(+rol, page, limit);
  }

  @Get('list')
  async findAllList(@Req() req): Promise<ApiResponseCommon> {
    const idUser = req.user.userId;
    const cliente = req.user.cliente;
    const rol = req.user.rol;
    return await this.rolesService.findAllList(+rol);
  }


  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @Req() req,
  ) {
    const idUser = req.user.userId;
    return this.rolesService.update(id, idUser, updateRoleDto);
  }

  @Patch('estatus/:id')
  async updateEstatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Body() updateRolEstatusDto: UpdateRolEstatusDto,
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.rolesService.updateEstatus(
      id,
      idUser,
      updateRolEstatusDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const idUser = req.user.userId;
    return this.rolesService.remove(+id, idUser);
  }
}
