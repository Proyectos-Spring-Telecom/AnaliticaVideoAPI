import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import type { Response } from 'express';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('pdf')
  async generarReportePDF(
    @Res() res: Response,
    @Request() req: any,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    try {
      // Obtener idCliente del token JWT
      const idCliente = req.user?.cliente ? parseInt(req.user.cliente, 10) : undefined;

      const pdfBuffer = await this.reportesService.generarReportePDF(
        fechaInicio,
        fechaFin,
        idCliente,
      );

      const fechaReporte = new Date().toISOString().split('T')[0];
      const nombreArchivo = `EMPRA-AIS_Reporte_Riesgo-${fechaReporte}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${nombreArchivo}"`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Error al generar el reporte PDF',
      });
    }
  }
}
