import { Controller, UseGuards } from '@nestjs/common';
import { PermisosService } from './permisos.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}
}
