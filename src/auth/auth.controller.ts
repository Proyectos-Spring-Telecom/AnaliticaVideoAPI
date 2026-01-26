import { Body, Controller, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { LoginAuthConfirmacionDto } from './dto/login-confirmacion.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { LoginAuthResetDto } from './dto/login-recuperacion.dto';

@Controller('login')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('usuario/recuperar/acceso')
  async email(@Body() loginAuthConfirmacionDto: LoginAuthConfirmacionDto) {
    console.log('Envia el correo.')
    return await this.authService.recuperarContrasena(loginAuthConfirmacionDto);
  }


  @Post()
  @HttpCode(200)
  async login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.signIn(loginAuthDto);
  }

  @Patch('cambiar/accesso')
  @UseGuards(JwtAuthGuard)
  async resetPassword(@Body() loginAuthResetDto: LoginAuthResetDto) {
    return await this.authService.resetPassword(loginAuthResetDto);
  }
}
