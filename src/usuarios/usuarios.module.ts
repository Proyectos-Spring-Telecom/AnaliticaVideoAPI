import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuarios } from 'src/entities/Usuarios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailServiceService } from 'src/mail-service/mail-service.service';
import { BitacoraModule } from 'src/bitacora/bitacora.module';
import { ClientesModule } from 'src/clientes/clientes.module';
import { UsuariosPermisos } from 'src/entities/UsuariosPermisos';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Usuarios,UsuariosPermisos]),BitacoraModule,  ClientesModule,AuthModule],
  controllers: [UsuariosController],
  providers: [UsuariosService,MailServiceService],
})
export class UsuariosModule {}
