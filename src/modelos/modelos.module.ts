import { Module } from '@nestjs/common';
import { ModelosService } from './modelos.service';
import { ModelosController } from './modelos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatModelos } from 'src/entities/CatModelos';
import { CatMarca } from 'src/entities/CatMarcas';
import { CatProducto } from 'src/entities/CatProducto';
import { BitacoraModule } from 'src/bitacora/bitacora.module';

@Module({
  imports:[TypeOrmModule.forFeature([CatModelos,CatMarca,CatProducto]),BitacoraModule],
  controllers: [ModelosController],
  providers: [ModelosService],
})
export class ModelosModule {}
