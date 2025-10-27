import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ClientesModule } from './clientes/clientes.module';
import { RolesModule } from './roles/roles.module';
import { ModulosModule } from './modulos/modulos.module';
import { PermisosModule } from './permisos/permisos.module';
import { MarcasModule } from './marcas/marcas.module';
import { BitacoraModule } from './bitacora/bitacora.module';
import { AuthModule } from './auth/auth.module';
import { ModelosModule } from './modelos/modelos.module';
import { EquiposModule } from './equipos/equipos.module';
import { MailServiceService } from './mail-service/mail-service.service';
import { CatProductosModule } from './cat-productos/cat-productos.module';
import { IncidenciasModule } from './incidencias/incidencias.module';
import { InstalacionCentralModule } from './instalacion-central/instalacion-central.module';
import { InstalacionEquipoModule } from './instalacion-equipo/instalacion-equipo.module';
import Joi from 'joi';

@Module({
  imports: [ ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(3306),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().allow(''), 
        DB_DATABASE: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(),
  
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: false,
        entities: [__dirname + '/entities/*{.ts,.js}'],
        synchronize: false, //Nunca poner en true 
        dateStrings: false,
        timezone: 'Z'
      }),
    }),

    UsuariosModule,

    ClientesModule,

    RolesModule,

    ModulosModule,

    PermisosModule,

    MarcasModule,

    ModelosModule,

    AuthModule,

    BitacoraModule,
    EquiposModule,
    CatProductosModule,
    IncidenciasModule,
    InstalacionCentralModule,
    InstalacionEquipoModule],
  controllers: [AppController],
  providers: [MailServiceService],
})
export class AppModule {}
