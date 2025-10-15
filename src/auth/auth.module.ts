import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosPermisos } from 'src/entities/UsuariosPermisos';
import { Usuarios } from 'src/entities/Usuarios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { BitacoraModule } from 'src/bitacora/bitacora.module';
import { BitacoraService } from 'src/bitacora/bitacora.service';


@Module({
  imports:[
    
    BitacoraModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports:[ConfigModule],
      inject:[ConfigService],
      useFactory:(config: ConfigService)=>({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {expiresIn: config.get<string>('JWT_EXPIRES_IN') as any}
      })
    }),
    TypeOrmModule.forFeature([Usuarios,UsuariosPermisos]),],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy,BitacoraModule],
  exports: [JwtModule]
})
export class AuthModule {}
