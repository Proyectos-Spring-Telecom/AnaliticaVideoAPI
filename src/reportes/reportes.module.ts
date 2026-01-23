import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { InstalacionCentral } from 'src/entities/InstalacionCentral';
import { InstalacionEquipo } from 'src/entities/InstalacionEquipo';
import { Equipos } from 'src/entities/Equipos';
import { Incidencia } from 'src/entities/Incidencias';
import { Clientes } from 'src/entities/Clientes';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InstalacionCentral,
      InstalacionEquipo,
      Equipos,
      Incidencia,
      Clientes,
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
