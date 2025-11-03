import { Module } from '@nestjs/common';
import { InstalacionEquipoService } from './instalacion-equipo.service';
import { InstalacionEquipoController } from './instalacion-equipo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipos } from 'src/entities/Equipos';
import { InstalacionEquipo } from 'src/entities/InstalacionEquipo';
import { BitacoraModule } from 'src/bitacora/bitacora.module';
import { InstalacionCentral } from 'src/entities/InstalacionCentral';

@Module({
  imports:[TypeOrmModule.forFeature([Equipos,InstalacionEquipo,InstalacionCentral]), BitacoraModule],
  controllers: [InstalacionEquipoController],
  providers: [InstalacionEquipoService],
})
export class InstalacionEquipoModule {}
