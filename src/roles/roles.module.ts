import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Type } from 'class-transformer';
import { Roles } from 'src/entities/Roles';
import { Bitacora } from 'src/entities/Bitacora';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BitacoraService } from 'src/bitacora/bitacora.service';
import { BitacoraModule } from 'src/bitacora/bitacora.module';

@Module({
  imports:[TypeOrmModule.forFeature([Roles]),BitacoraModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
