import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { BitacoraModule } from 'src/bitacora/bitacora.module';
import { S3Module } from 'src/s3/s3.module';
import { Clientes } from 'src/entities/Clientes';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Clientes]), BitacoraModule, S3Module],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService]
})
export class ClientesModule {}
