import { Module } from '@nestjs/common';
import { EquiposService } from './equipos.service';
import { EquiposController } from './equipos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipos } from 'src/entities/Equipos';
import { BitacoraModule } from 'src/bitacora/bitacora.module';
import { Clientes } from 'src/entities/Clientes';

@Module({
  imports:[TypeOrmModule.forFeature([Equipos, Clientes]),BitacoraModule],
  controllers: [EquiposController],
  providers: [EquiposService],
})
export class EquiposModule {}
