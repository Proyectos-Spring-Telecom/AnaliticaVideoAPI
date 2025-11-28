import { Module } from '@nestjs/common';
import { InstalacionCentralService } from './instalacion-central.service';
import { InstalacionCentralController } from './instalacion-central.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstalacionCentral } from 'src/entities/InstalacionCentral';
import { BitacoraModule } from 'src/bitacora/bitacora.module';
import { Clientes } from 'src/entities/Clientes';

@Module({
  imports: [TypeOrmModule.forFeature([InstalacionCentral, Clientes]),BitacoraModule],
  controllers: [InstalacionCentralController],
  providers: [InstalacionCentralService],
})
export class InstalacionCentralModule {}
