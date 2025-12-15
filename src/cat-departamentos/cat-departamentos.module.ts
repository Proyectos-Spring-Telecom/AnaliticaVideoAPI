import { Module } from '@nestjs/common';
import { CatDepartamentosService } from './cat-departamentos.service';
import { CatDepartamentosController } from './cat-departamentos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatDepartamentos } from 'src/entities/CatDepartamentos';
import { Clientes } from 'src/entities/Clientes';
import { BitacoraModule } from 'src/bitacora/bitacora.module';

@Module({
  imports: [TypeOrmModule.forFeature([CatDepartamentos, Clientes]), BitacoraModule],
  controllers: [CatDepartamentosController],
  providers: [CatDepartamentosService],
  exports: [CatDepartamentosService],
})
export class CatDepartamentosModule {}
