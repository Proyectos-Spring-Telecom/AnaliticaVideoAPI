import { Module } from '@nestjs/common';
import { InstalacionEquipoService } from './instalacion-equipo.service';
import { InstalacionEquipoController } from './instalacion-equipo.controller';

@Module({
  controllers: [InstalacionEquipoController],
  providers: [InstalacionEquipoService],
})
export class InstalacionEquipoModule {}
