import { Module } from '@nestjs/common';
import { InstalacionCentralService } from './instalacion-central.service';
import { InstalacionCentralController } from './instalacion-central.controller';

@Module({
  controllers: [InstalacionCentralController],
  providers: [InstalacionCentralService],
})
export class InstalacionCentralModule {}
