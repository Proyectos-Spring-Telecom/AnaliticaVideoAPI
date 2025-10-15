import { Module } from '@nestjs/common';
import { MarcasService } from './marcas.service';
import { MarcasController } from './marcas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatMarca } from 'src/entities/CatMarcas';
import { BitacoraModule } from 'src/bitacora/bitacora.module';

@Module({
  imports:[TypeOrmModule.forFeature([CatMarca]),BitacoraModule],
  controllers: [MarcasController],
  providers: [MarcasService],
})
export class MarcasModule {}
