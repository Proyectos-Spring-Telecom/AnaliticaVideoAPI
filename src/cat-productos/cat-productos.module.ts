import { Module } from '@nestjs/common';
import { CatProductosService } from './cat-productos.service';
import { CatProductosController } from './cat-productos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatProducto } from 'src/entities/CatProducto';
import { BitacoraModule } from 'src/bitacora/bitacora.module';

@Module({
  imports:[TypeOrmModule.forFeature([CatProducto]),BitacoraModule],
  controllers: [CatProductosController],
  providers: [CatProductosService],
})
export class CatProductosModule {}
