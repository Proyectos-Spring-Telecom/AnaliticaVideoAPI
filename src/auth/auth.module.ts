import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosPermisos } from 'src/entities/UsuariosPermisos';
import { Usuarios } from 'src/entities/Usuarios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<any> => ({
        secret: config.get<string>('JWT_SECRET') || 'super_secret_key',
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') || '1d',
        },
      }),
    }),
        TypeOrmModule.forFeature([Usuarios,UsuariosPermisos])
  ],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy],
  exports:[JwtModule]
})
export class AuthModule {}
