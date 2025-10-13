import { Controller, UseGuards } from '@nestjs/common';
import { ModulosService } from './modulos.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('modulos')
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}
}
