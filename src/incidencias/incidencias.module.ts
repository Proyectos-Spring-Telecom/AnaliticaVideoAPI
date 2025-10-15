import { Module } from '@nestjs/common';
import { IncidenciasService } from './incidencias.service';
import { IncidenciasController } from './incidencias.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incidencia } from 'src/entities/Incidencias';

@Module({
  imports:[TypeOrmModule.forFeature([Incidencia])
  ],
  controllers: [IncidenciasController],
  providers: [IncidenciasService],
})
export class IncidenciasModule {}
