import { HttpException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Usuarios } from 'src/entities/Usuarios';
import { InjectRepository } from '@nestjs/typeorm';
import { UsuariosPermisos } from 'src/entities/UsuariosPermisos';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(@InjectRepository(Usuarios)
    private readonly usuariosRepository: Repository<Usuarios>,
        private readonly jwtService: JwtService, @InjectRepository(UsuariosPermisos)
        private permisosRepository: Repository<UsuariosPermisos>,) { }

    async signIn(loginAuthDto: LoginAuthDto) {

        try {
            const user = await this.usuariosRepository.findOne({
                relations: ['idRol2','idCliente2'],
                where: { userName: loginAuthDto.userName, estatus: 1 },
            });
            if (
                !user ||
                !(await bcrypt.compare(loginAuthDto.password, user.passwordHash))
            ) {
          
                throw new UnauthorizedException('Credenciales invalidas');
            }

            const permisos = await this.permisosRepository.find({
                select: ['idPermiso'],
                where: { idUsuario: user.id, estatus: 1 },
            });

            const payload = {
                id: user.id,
                email: user.userName,
                cliente: user.idCliente,
                rol: user.idRol
            };

            function pad(n: number) {
                return n < 10 ? '0' + n : n;
            }
            const ahora = new Date();
            const fechaActual = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())} ${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;

            await this.usuariosRepository.update(user.id, {
                ultimoLogin: fechaActual,
            });
            return {
                message: `login exitoso`,
                id: Number(`${user.id}`),
                idCliente: Number(`${user.idCliente}`),
                nombre: `${user.nombre}`,
                apellidoPaterno: `${user.apellidoPaterno}`,
                apellidoMaterno: `${user.apellidoMaterno}`,
                telefono: `${user.telefono}`,
                ultimoLogin: `${user.ultimoLogin}`,
                fechaCreacion: `${user.fechaCreacion}`,
                fotoPerfil: `${user.fotoPerfil}`,
                userName: `${user.userName}`,
                rol: user.idRol,
                rolNombre: user.idRol2.nombre,
                token: this.jwtService.sign(payload),
                permisos: permisos,
                logo: user.idCliente2?.logotipo,
                nombreCliente: user.idCliente2?.nombre,
                apellidoPaternoCliente: user.idCliente2?.apellidoPaterno,
                apellidoMaternoCliente: user.idCliente2?.apellidoMaterno,
                telefonoCliente: user.idCliente2?.telefono,
                emailCliente: user.idCliente2?.correo,
                direccionCliente: user.idCliente2?.calle,
                ciudadCliente: user.idCliente2?.municipio,
                estadoCliente: user.idCliente2?.estado,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(error);
        }
    }

    async generateToken(user: { id: number; email: string }) {
        const payload = { id: user.id, email: user.email };
        const token = this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: (process.env.JWT_CONFIRMACION || '1h') as any,
        });
        return token;
      }
}
