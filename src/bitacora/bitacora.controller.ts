import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { BitacoraService } from './bitacora.service';
import { ApiResponseCommon } from 'src/common/ApiResponse';
import { CreateBitacoraDto } from './dto/create-bitac ora.dto';

@Controller('bitacora')
export class BitacoraController {
  constructor(private readonly bitacoraService: BitacoraService) {}

  @Post()
  create(@Body() createBitacoraDto: CreateBitacoraDto) {
    return this.bitacoraService.createBitacora(createBitacoraDto);
  }

  @Get('list')
  async findAllListBitacora(): Promise<ApiResponseCommon> {
    return await this.bitacoraService.findAllListBitacora();
  }

  @Get(':page/:limit')
  findAll(
    @Param('page', ParseIntPipe) page: number,
    @Param('limit', ParseIntPipe) limit: number,
  ): Promise<ApiResponseCommon> {
    return this.bitacoraService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(@Param('id',ParseIntPipe)id: number) {
    return await this.bitacoraService.findOne(id);
  }
}
