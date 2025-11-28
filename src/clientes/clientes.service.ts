import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { S3Service } from 'src/s3/s3.service';
import { Clientes } from 'src/entities/Clientes';
import { Repository } from 'typeorm';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { ApiCrudResponse, ApiResponseCommon, EstatusEnumBitcora } from 'src/common/ApiResponse';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { UpdateClienteEstatusDto } from './dto/update-cliente-estatus.dto';
import { getClienteHijos, getClienteHijosPag } from 'src/utils/cliente-utils';

@Injectable()
export class ClientesService {
    constructor(
    @InjectRepository(Clientes)
    private readonly clienteRepository: Repository<Clientes>,
    private readonly bitacoraLogger: BitacoraService,
    private readonly s3Service: S3Service,
  ) {}
  //Crear cliente
  async createCliente(
    createClienteDto: CreateClienteDto,
    idUser: number,
    files?: {
      logotipo?: Express.Multer.File[];
      constanciaSituacionFiscal?: Express.Multer.File[];
      comprobanteDomicilio?: Express.Multer.File[];
      actaConstitutiva?: Express.Multer.File[];
    },
  ): Promise<ApiCrudResponse> {
    try {
      const clienteCreate = await this.clienteRepository.findOne({
        where: {
          rfc: createClienteDto.rfc,
        },
      });
      if (clienteCreate) {
        throw new BadRequestException(
          `Cliente ya registrado con RFC: ${createClienteDto.rfc}. Por favor, ingrese un RFC diferente.`,
        );
      }

      // Subir archivos a S3 si existen
      if (files?.logotipo && files.logotipo[0]) {
        const uploadResult = await this.s3Service.uploadFile(files.logotipo[0], 'Clientes', idUser, 1);
        createClienteDto.logotipo = uploadResult.url;
      } else {
        // Limpiar el campo si no se subió archivo (puede venir como objeto o string vacío desde form-data)
        delete createClienteDto.logotipo;
      }
      
      if (files?.constanciaSituacionFiscal && files.constanciaSituacionFiscal[0]) {
        const uploadResult = await this.s3Service.uploadFile(files.constanciaSituacionFiscal[0], 'Clientes', idUser, 1);
        createClienteDto.constanciaSituacionFiscal = uploadResult.url;
      } else {
        delete createClienteDto.constanciaSituacionFiscal;
      }
      
      if (files?.comprobanteDomicilio && files.comprobanteDomicilio[0]) {
        const uploadResult = await this.s3Service.uploadFile(files.comprobanteDomicilio[0], 'Clientes', idUser, 1);
        createClienteDto.comprobanteDomicilio = uploadResult.url;
      } else {
        delete createClienteDto.comprobanteDomicilio;
      }
      
      if (files?.actaConstitutiva && files.actaConstitutiva[0]) {
        const uploadResult = await this.s3Service.uploadFile(files.actaConstitutiva[0], 'Clientes', idUser, 1);
        createClienteDto.actaConstitutiva = uploadResult.url;
      } else {
        delete createClienteDto.actaConstitutiva;
      }

      const clienteData = await this.clienteRepository.create(createClienteDto);
      const clienteCreado = await this.clienteRepository.save(clienteData);

      //-----Registro en la bitacora----- SUCCESS
      // Excluir campos de archivo (URLs largas) para evitar exceder el límite del campo Query
      const { logotipo, constanciaSituacionFiscal, comprobanteDomicilio, actaConstitutiva, ...clienteDtoSinArchivos } = createClienteDto;
      // Convertir a objeto plano para evitar problemas de serialización
      const querylogger = JSON.parse(JSON.stringify({ 
        createClienteDto: clienteDtoSinArchivos,
        archivosSubidos: {
          logotipo: logotipo ? 'Sí' : 'No',
          constanciaSituacionFiscal: constanciaSituacionFiscal ? 'Sí' : 'No',
          comprobanteDomicilio: comprobanteDomicilio ? 'Sí' : 'No',
          actaConstitutiva: actaConstitutiva ? 'Sí' : 'No',
        }
      }));
      await this.bitacoraLogger.logToBitacora(
        'Clientes',
        `Cliente creado correctamente con RFC: ${createClienteDto.rfc}.`,
        'CREATE',
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.SUCCESS,
      );

      //Api response
      const result: ApiCrudResponse = {
        status: 'success',
        message: 'El cliente ha sido creado correctamente.',
        data: {
          id: clienteCreado.id,
          nombre:
            `${clienteCreado.nombre} ${clienteCreado.apellidoPaterno} ` || '',
        },
      };
      return result;
    } catch (error) {
      //-----Registro en la bitacora----- ERROR
      // Excluir campos de archivo (URLs largas) para evitar exceder el límite del campo Query
      const { logotipo, constanciaSituacionFiscal, comprobanteDomicilio, actaConstitutiva, ...clienteDtoSinArchivos } = createClienteDto;
      // Convertir a objeto plano para evitar problemas de serialización
      const querylogger = JSON.parse(JSON.stringify({ 
        createClienteDto: clienteDtoSinArchivos,
        archivosSubidos: {
          logotipo: logotipo ? 'Sí' : 'No',
          constanciaSituacionFiscal: constanciaSituacionFiscal ? 'Sí' : 'No',
          comprobanteDomicilio: comprobanteDomicilio ? 'Sí' : 'No',
          actaConstitutiva: actaConstitutiva ? 'Sí' : 'No',
        }
      }));
      await this.bitacoraLogger.logToBitacora(
        'Clientes',
        `Error al crear cliente con RFC: ${createClienteDto.rfc}.`,
        'CREATE',
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.ERROR,
        error.message,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Ocurrió un error al intentar crear un cliente.',
        error: error.message,
      });
    }
  }


  // ========================================
  // 🔹 OBTENER PAGINADO DE CLIENTES
  // ========================================
  async getAllClientes(
    idUser: number,
    cliente: number,
    rol: number,
    page: number,
    limit: number,
  ): Promise<ApiResponseCommon> {
    try {
      const offset = (page - 1) * limit;
      let totalResult;
      let clientes;
      switch (rol) {
        case 1:
          // Usuario SuperAdministrador - obtiene todas las regiones
          clientes = await this.clienteRepository.query(
            `
SELECT
  Id AS id,
  RFC AS rfc,
  TipoPersona AS tipoPersona,
  Nombre AS nombre,
  ApellidoPaterno AS apellidoPaterno,
  ApellidoMaterno AS apellidoMaterno,
  Telefono AS telefono,
  Correo AS correo,
  Estado AS estado,
  Municipio AS municipio,
  Colonia AS colonia,
  Calle AS calle,
  EntreCalles AS entreCalles,
  NumeroExterior AS numeroExterior,
  NumeroInterior AS numeroInterior,
  CP AS cp,
  NombreEncargado AS nombreEncargado,
  TelefonoEncargado AS telefonoEncargado,
  CorreoEncargado AS correoEncargado,
  ConstanciaSituacionFiscal AS constanciaSituacionFiscal,
  ComprobanteDomicilio AS comprobanteDomicilio,
  ActaConstitutiva AS actaConstitutiva,
  Logotipo AS logotipo,
  Estatus AS estatus
  
FROM Clientes
ORDER BY Id ASC
  LIMIT ? OFFSET ?;
            `,
            [ limit, offset],
          );

          // Query para total (sin paginación)
          totalResult = await this.clienteRepository.query(
            `
  SELECT COUNT(*) AS total
FROM Clientes

  `, 
          );
          break;

        default:
           const { ids, placeholders } = await getClienteHijosPag(this.clienteRepository, cliente);
          
          // Si no hay IDs, retornar resultados vacíos
          if (ids.length === 0 || !placeholders) {
            clientes = [];
            totalResult = [{ total: 0 }];
          } else {
            clientes = await this.clienteRepository.query(
              `
SELECT
  Id AS id,
  RFC AS rfc,
  TipoPersona AS tipoPersona,
  Nombre AS nombre,
  ApellidoPaterno AS apellidoPaterno,
  ApellidoMaterno AS apellidoMaterno,
  Telefono AS telefono,
  Correo AS correo,
  Estado AS estado,
  Municipio AS municipio,
  Colonia AS colonia,
  Calle AS calle,
  EntreCalles AS entreCalles,
  NumeroExterior AS numeroExterior,
  NumeroInterior AS numeroInterior,
  CP AS cp,
  NombreEncargado AS nombreEncargado,
  TelefonoEncargado AS telefonoEncargado,
  CorreoEncargado AS correoEncargado,
  ConstanciaSituacionFiscal AS constanciaSituacionFiscal,
  ComprobanteDomicilio AS comprobanteDomicilio,
  ActaConstitutiva AS actaConstitutiva,
  Logotipo AS logotipo,
  Estatus AS estatus
  
FROM Clientes
WHERE Id IN (${placeholders})   -- 🔹 aquí colocas el ID del cliente que quieres consultar
ORDER BY Id ASC
  LIMIT ? OFFSET ?;
              `,
              [...ids, limit, offset],
            );

            // Query para total (sin paginación)
            totalResult = await this.clienteRepository.query(
              `
  SELECT COUNT(*) AS total
FROM Clientes
WHERE Id IN (${placeholders})    -- 🔹 aquí colocas el ID del cliente que quieres consultar
ORDER BY Id ASC

  `,
              [...ids],
            );
          }
          break;
      }

      // 🔥 Forzamos ids a number y agregamos nombreCompleto
      const data = clientes.map((item) => ({
        ...item,
        id: Number(item.id),
      }));

      const total = Number(totalResult[0]?.total || 0);

      const result: ApiResponseCommon = {
        data,
        paginated: {
          total: total,
          page,
          lastPage: Math.ceil(total / limit),
        },
      };
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Ocurrió un error al obtener paginados de los clientes.',
      });
    }
  }

  // ========================================
  // 🔹 OBTENER UN LISTADO DE CLIENTES
  // ========================================
  async getAllListClientes(
    idUser: number,
    cliente: number,
    rol: number,
  ): Promise<ApiResponseCommon> {
    try {
      let clientes;
      switch (rol) {
        case 1:
          // Usuario SuperAdministrador - obtiene todas las regiones
          clientes = await this.clienteRepository.query(
            `
SELECT
  Id AS id,
  Nombre AS nombre,
  ApellidoPaterno AS apellidoPaterno,
  ApellidoMaterno AS apellidoMaterno,
  Logotipo AS logotipo
FROM Clientes
WHERE Estatus = 1
ORDER BY Id ASC;
            `,
          );
          break;

        default:
            // Usuarios normales - solo sus regiones asignadas
           const { ids, placeholders } = await getClienteHijos(this.clienteRepository, cliente);
          
          // Si no hay IDs, retornar resultados vacíos
          if (ids.length === 0 || !placeholders) {
            clientes = [];
          } else {
            clientes = await this.clienteRepository.query(
              `
SELECT
  Id AS id,
  Nombre AS nombre,
  ApellidoPaterno AS apellidoPaterno,
  ApellidoMaterno AS apellidoMaterno,
  Logotipo AS logotipo
FROM Clientes
WHERE Id IN (${placeholders})  -- 🔹 aquí colocas el ID del cliente que quieres consultar
  AND Estatus = 1
ORDER BY Id ASC;

              `,
              [...ids],
            );
          }
          break;
      }

      // 🔥 Forzamos ids a number y agregamos nombreCompleto
      const data = clientes.map((item) => ({
        ...item,
        id: Number(item.id),
      }));

      const result: ApiResponseCommon = {
        data: data,
      };
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Ocurrió un error al obtener listado de los clientes.',
      });
    }
  }

  //Obtener el cliente por ID
  async getOneCliente(id: number) {
    try {
      const cliente = await this.clienteRepository.findOne({
        where: { id: id },
      });
      if (!cliente) {
        throw new NotFoundException(
          `El cliente con ID: ${id} no fue encontrado.`,
        );
      }
      return { data: cliente };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException({
        message: `Error al obtener el cliente con ID: ${id}.`,
      });
    }
  }

  //Actualizar informacion del cliente
  async updateCliente(
    id: number,
    idUser: number,
    updateClienteDto: UpdateClienteDto,
    files?: {
      logotipo?: Express.Multer.File[];
      constanciaSituacionFiscal?: Express.Multer.File[];
      comprobanteDomicilio?: Express.Multer.File[];
      actaConstitutiva?: Express.Multer.File[];
    },
  ): Promise<ApiCrudResponse> {
    try {
      const Cliente = await this.clienteRepository.findOne({
        where: { id: id },
      });
      if (!Cliente) {
        throw new NotFoundException(
          `El cliente con ID: ${id} no fue encontrado.`,
        );
      }

      // Subir archivos a S3 si existen (solo actualizar si se envía un nuevo archivo)
      if (files?.logotipo && files.logotipo[0]) {
        const uploadResult = await this.s3Service.uploadFile(files.logotipo[0], 'Clientes', idUser, 1);
        updateClienteDto.logotipo = uploadResult.url;
      } else {
        // Limpiar el campo si no se subió archivo (puede venir como objeto o string vacío desde form-data)
        delete updateClienteDto.logotipo;
      }
      
      if (files?.constanciaSituacionFiscal && files.constanciaSituacionFiscal[0]) {
        const uploadResult = await this.s3Service.uploadFile(files.constanciaSituacionFiscal[0], 'Clientes', idUser, 1);
        updateClienteDto.constanciaSituacionFiscal = uploadResult.url;
      } else {
        delete updateClienteDto.constanciaSituacionFiscal;
      }
      
      if (files?.comprobanteDomicilio && files.comprobanteDomicilio[0]) {
        const uploadResult = await this.s3Service.uploadFile(files.comprobanteDomicilio[0], 'Clientes', idUser, 1);
        updateClienteDto.comprobanteDomicilio = uploadResult.url;
      } else {
        delete updateClienteDto.comprobanteDomicilio;
      }
      
      if (files?.actaConstitutiva && files.actaConstitutiva[0]) {
        const uploadResult = await this.s3Service.uploadFile(files.actaConstitutiva[0], 'Clientes', idUser, 1);
        updateClienteDto.actaConstitutiva = uploadResult.url;
      } else {
        delete updateClienteDto.actaConstitutiva;
      }

      const clienteData = await this.clienteRepository.create(updateClienteDto);
      await this.clienteRepository.update(id, clienteData);

      //-----Registro en la bitacora----- SUCCESS
      // Excluir campos de archivo (URLs largas) para evitar exceder el límite del campo Query
      const { logotipo, constanciaSituacionFiscal, comprobanteDomicilio, actaConstitutiva, ...clienteDtoSinArchivos } = updateClienteDto;
      // Convertir a objeto plano para evitar problemas de serialización
      const querylogger = JSON.parse(JSON.stringify({ 
        updateClienteDto: clienteDtoSinArchivos,
        archivosSubidos: {
          logotipo: logotipo ? 'Sí' : 'No',
          constanciaSituacionFiscal: constanciaSituacionFiscal ? 'Sí' : 'No',
          comprobanteDomicilio: comprobanteDomicilio ? 'Sí' : 'No',
          actaConstitutiva: actaConstitutiva ? 'Sí' : 'No',
        }
      }));
      await this.bitacoraLogger.logToBitacora(
        'Clientes',
        `Cliente con ID: ${id} actualizado correctamente.`,
        'UPDATE',
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.SUCCESS,
      );

      //Hacemos un expose que convierta los atributos en PascalCase
      const clientefind = await this.clienteRepository.findOne({
        where: { id: id },
      });
      //Api response
      const result: ApiCrudResponse = {
        status: 'success',
        message: 'Cliente actualizado correctamente.',
        data: {
          id: id,
          nombre:
            `${clientefind?.nombre} ${clientefind?.apellidoPaterno} ` || '',
        },
      };
      return result;
    } catch (error) {
      //-----Registro en la bitacora----- ERROR
      // Excluir campos de archivo (URLs largas) para evitar exceder el límite del campo Query
      const { logotipo, constanciaSituacionFiscal, comprobanteDomicilio, actaConstitutiva, ...clienteDtoSinArchivos } = updateClienteDto;
      // Convertir a objeto plano para evitar problemas de serialización
      const querylogger = JSON.parse(JSON.stringify({ 
        updateClienteDto: clienteDtoSinArchivos,
        archivosSubidos: {
          logotipo: logotipo ? 'Sí' : 'No',
          constanciaSituacionFiscal: constanciaSituacionFiscal ? 'Sí' : 'No',
          comprobanteDomicilio: comprobanteDomicilio ? 'Sí' : 'No',
          actaConstitutiva: actaConstitutiva ? 'Sí' : 'No',
        }
      }));
      await this.bitacoraLogger.logToBitacora(
        'Clientes',
        `Error al actualizar cliente con ID: ${id}.`,
        'UPDATE',
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.ERROR,
        error.message,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: `Error al actualizar la información del cliente con ID: ${id}`,
        error: error.message,
      });
    }
  }
  //Cambiar el estatus del cliente
  async updateClienteStatus(
    id: number,
    idUser: number,
    updateClienteEstatusDto: UpdateClienteEstatusDto,
  ): Promise<ApiCrudResponse> {
    try {
      const usuario = await this.clienteRepository.findOne({
        where: { id: id },
      });
      if (!usuario) {
        throw new NotFoundException(`Cliente con ID: ${id} no encontrado`);
      }
      const estatus = updateClienteEstatusDto.estatus;
      await this.clienteRepository.update(id, { estatus });

      //-----Registro en la bitacora----- SUCCESS
      const querylogger = { updateClienteEstatusDto };
      await this.bitacoraLogger.logToBitacora(
        'Clientes',
        `El estatus del cliente con ID ${id} se modificó exitosamente a: ${estatus}.`,
        'UPDATE',
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.SUCCESS,
      );

      //Api response
      const result: ApiCrudResponse = {
        status: 'success',
        message: 'Estatus del cliente actualizado correctamente.',
        estatus: { estatus: estatus },
        data: {
          id: id,
          nombre: `${usuario.nombre} ${usuario.apellidoPaterno} ` || '',
        },
      };
      return result;
    } catch (error) {
      //-----Registro en la bitacora----- ERROR
      const querylogger = { updateClienteEstatusDto };
      await this.bitacoraLogger.logToBitacora(
        'Clientes',
        `Se cambió el estatus del cliente con ID: ${id} a estatus: ${updateClienteEstatusDto.estatus}.`,
        'UPDATE',
        querylogger,
        idUser,
        1,
        EstatusEnumBitcora.ERROR,
        error.message,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: `Error al cambiar el estatus del cliente con ID: ${id}.`,
        error: error.message,
      });
    }
  }
  //Eliminar cliente
  async removeCliente(id: number, idUser: number): Promise<ApiCrudResponse> {
    try {
      const clienteEliminar = await this.clienteRepository.findOne({
        where: { id: id },
      });
      if (!clienteEliminar) {
        throw new NotFoundException(
          `El cliente con ID: ${id} no fue encontrado.`,
        );
      }
      await this.clienteRepository.update(id, { estatus: 0 });

      //-----Registro en la bitacora----- SUCCESS
      const querylogger = { id: id, estatus: 0 };
      await this.bitacoraLogger.logToBitacora(
        'Clientes',
        `Se eliminó el cliente con ID: ${id}.`,
        'UPDATE',
        querylogger,
        Number(idUser),
        1,
        EstatusEnumBitcora.SUCCESS,
      );

      //Api response
      const result: ApiCrudResponse = {
        status: 'success',
        message: 'El cliente fue eliminado correctamente.',
        data: {
          id: id,
          nombre:
            `${clienteEliminar.nombre} ${clienteEliminar.apellidoPaterno} ` ||
            '',
        },
      };
      return result;
    } catch (error) {
      //-----Registro en la bitacora----- ERROR
      const querylogger = { id: id, estatus: 0 };
      await this.bitacoraLogger.logToBitacora(
        'Clientes',
        `Se eliminó el cliente con ID: ${id}.`,
        'UPDATE',
        querylogger,
        Number(idUser),
        1,
        EstatusEnumBitcora.ERROR,
        error.message,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: `Error al eliminar el cliente con ID: ${id}.`,
        error: error.message,
      });
    }
  }
}
