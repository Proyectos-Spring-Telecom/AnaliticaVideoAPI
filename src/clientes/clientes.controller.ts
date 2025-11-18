import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { ApiCrudResponse, ApiResponseCommon } from 'src/common/ApiResponse';
import { UpdateClienteEstatusDto } from './dto/update-cliente-estatus.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}
  //Crear cliente
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logotipo', maxCount: 1 },
        { name: 'constanciaSituacionFiscal', maxCount: 1 },
        { name: 'comprobanteDomicilio', maxCount: 1 },
        { name: 'actaConstitutiva', maxCount: 1 },
      ],
      {
        storage: multer.memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 }, // máximo 10 MB
        fileFilter: (req, file, cb) => {
          const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
          if (!allowedTypes.includes(file.mimetype)) {
            return cb(
              new Error('Solo se permiten PNG, JPG, JPEG o PDF'),
              false,
            );
          }
          cb(null, true);
        },
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateClienteDto })
  async createCliente(
    @Body() createClienteDto: CreateClienteDto,
    @UploadedFiles() files: {
      logotipo?: Express.Multer.File[];
      constanciaSituacionFiscal?: Express.Multer.File[];
      comprobanteDomicilio?: Express.Multer.File[];
      actaConstitutiva?: Express.Multer.File[];
    },
    @Req() req,
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.clientesService.createCliente(createClienteDto, idUser, files);
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
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logotipo', maxCount: 1 },
        { name: 'constanciaSituacionFiscal', maxCount: 1 },
        { name: 'comprobanteDomicilio', maxCount: 1 },
        { name: 'actaConstitutiva', maxCount: 1 },
      ],
      {
        storage: multer.memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 }, // máximo 10 MB
        fileFilter: (req, file, cb) => {
          const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
          if (!allowedTypes.includes(file.mimetype)) {
            return cb(
              new Error('Solo se permiten PNG, JPG, JPEG o PDF'),
              false,
            );
          }
          cb(null, true);
        },
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateClienteDto })
  async updateCliente(
    @Param('id') id: string,
    @Req() req,
    @Body() updateClienteDto: UpdateClienteDto,
    @UploadedFiles() files: {
      logotipo?: Express.Multer.File[];
      constanciaSituacionFiscal?: Express.Multer.File[];
      comprobanteDomicilio?: Express.Multer.File[];
      actaConstitutiva?: Express.Multer.File[];
    },
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.clientesService.updateCliente(+id, idUser, updateClienteDto, files);
  }

  //Eliminar Cliente
  @Delete(':id')
  async removeClientes(@Param('id') id: string, @Req() req): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    return await this.clientesService.removeCliente(+id, idUser);
  }
}
