import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { InstalacionCentral } from 'src/entities/InstalacionCentral';
import { InstalacionEquipo } from 'src/entities/InstalacionEquipo';
import { Equipos } from 'src/entities/Equipos';
import { Incidencia } from 'src/entities/Incidencias';
import { Clientes } from 'src/entities/Clientes';
import PDFDocument from 'pdfkit';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
type PDFDocumentType = InstanceType<typeof PDFDocument>;

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(InstalacionCentral)
    private instalacionCentralRepository: Repository<InstalacionCentral>,
    @InjectRepository(InstalacionEquipo)
    private instalacionEquipoRepository: Repository<InstalacionEquipo>,
    @InjectRepository(Equipos)
    private equiposRepository: Repository<Equipos>,
    @InjectRepository(Incidencia)
    private incidenciaRepository: Repository<Incidencia>,
    @InjectRepository(Clientes)
    private clienteRepository: Repository<Clientes>,
  ) {}

  async generarReportePDF(
    fechaInicio?: string,
    fechaFin?: string,
    idCliente?: number,
  ): Promise<Buffer> {
    try {
      // Determinar fechas por defecto (último mes si no se proporcionan)
      const fin = fechaFin
        ? new Date(`${fechaFin} 23:59:59`)
        : new Date();
      const inicio = fechaInicio
        ? new Date(`${fechaInicio} 00:00:00`)
        : new Date(new Date().setMonth(new Date().getMonth() - 1));

      // Obtener instalaciones centrales
      let instalacionesCentrales: InstalacionCentral[];
      if (idCliente) {
        instalacionesCentrales = await this.instalacionCentralRepository.find({
          where: { idCliente, estatus: 1 },
          relations: ['cliente', 'instalaciones', 'instalaciones.equipo'],
        });
      } else {
        instalacionesCentrales = await this.instalacionCentralRepository.find({
          where: { estatus: 1 },
          relations: ['cliente', 'instalaciones', 'instalaciones.equipo'],
        });
      }

      if (instalacionesCentrales.length === 0) {
        throw new BadRequestException(
          'No se encontraron instalaciones centrales activas para generar el reporte.',
        );
      }

      // Calcular estadísticas para cada instalación
      const estadisticas = await Promise.all(
        instalacionesCentrales.map(async (instalacion) => {
          const equiposIds = instalacion.instalaciones
            ?.map((inst) => inst.equipo?.numeroSerie)
            .filter(Boolean) || [];

          let totalIncidencias = 0;
          let incidenciasPorEstadoAnimo: Record<string, number> = {};
          let incidenciasPorGenero: Record<string, number> = {};
          let incidenciasPorEdad: { rango: string; cantidad: number }[] = [];
          let incidenciasDetalladas: any[] = [];

          if (equiposIds.length > 0) {
            // Usar query builder para mejor rendimiento con múltiples dispositivos
            const incidencias = await this.incidenciaRepository
              .createQueryBuilder('incidencia')
              .where('incidencia.idDispositivo IN (:...equiposIds)', {
                equiposIds,
              })
              .andWhere('incidencia.fecha BETWEEN :inicio AND :fin', {
                inicio,
                fin,
              })
              .orderBy('incidencia.fecha', 'DESC')
              .getMany();

            totalIncidencias = incidencias.length;

            // Estadísticas por estado de ánimo
            incidencias.forEach((inc) => {
              incidenciasPorEstadoAnimo[inc.estadoAnimo] =
                (incidenciasPorEstadoAnimo[inc.estadoAnimo] || 0) + 1;
            });

            // Estadísticas por género
            incidencias.forEach((inc) => {
              incidenciasPorGenero[inc.genero] =
                (incidenciasPorGenero[inc.genero] || 0) + 1;
            });

            // Estadísticas por rango de edad
            const rangosEdad = [
              { min: 0, max: 17, label: '0-17' },
              { min: 18, max: 25, label: '18-25' },
              { min: 26, max: 35, label: '26-35' },
              { min: 36, max: 50, label: '36-50' },
              { min: 51, max: 100, label: '51+' },
            ];

            rangosEdad.forEach((rango) => {
              const cantidad = incidencias.filter(
                (inc) => inc.edad >= rango.min && inc.edad <= rango.max,
              ).length;
              if (cantidad > 0) {
                incidenciasPorEdad.push({
                  rango: rango.label,
                  cantidad,
                });
              }
            });

            // Obtener todas las incidencias para estadísticas (no solo las 10 más recientes)
            incidenciasDetalladas = incidencias.map((inc) => ({
              id: inc.id,
              fecha: inc.fecha,
              genero: inc.genero,
              edad: inc.edad,
              estadoAnimo: inc.estadoAnimo,
              idDispositivo: inc.idDispositivo,
            }));
          }

          return {
            instalacion,
            totalIncidencias,
            incidenciasPorEstadoAnimo,
            incidenciasPorGenero,
            incidenciasPorEdad,
            incidenciasDetalladas,
            equiposIds,
          };
        }),
      );

      // Obtener todas las ubicaciones de equipos para el mapa
      const whereCondition: any = { estatus: 1 };
      if (idCliente) {
        whereCondition.idCliente = idCliente;
      }
      
      const ubicacionesEquipos = await this.instalacionEquipoRepository.find({
        where: whereCondition,
        relations: ['equipo', 'instalacionCentral'],
      });
      
      console.log(`[Reporte] Ubicaciones de equipos encontradas: ${ubicacionesEquipos.length}`);

      // Generar PDF
      return await this.generarPDF(
        estadisticas,
        ubicacionesEquipos,
        inicio,
        fin,
      );
    } catch (error) {
      console.error('Error generando reporte PDF:', error);
      throw new BadRequestException(
        `Error al generar el reporte: ${error.message}`,
      );
    }
  }

  private async generarPDF(
    estadisticas: any[],
    ubicacionesEquipos: InstalacionEquipo[],
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Portada
        this.agregarPortada(doc, fechaInicio, fechaFin);

        // Tabla de contenido
        this.agregarTablaContenido(doc, estadisticas.length);

        // Resumen ejecutivo
        await this.agregarResumenEjecutivo(doc, estadisticas, fechaInicio, fechaFin);

        // Mapa de ubicaciones
        await this.agregarMapa(doc, ubicacionesEquipos);

        // Estadísticas por instalación
        estadisticas.forEach((stat, index) => {
          if (index > 0) doc.addPage();
          this.agregarEstadisticasInstalacion(doc, stat, index + 1);
        });

        // Anexo de incidencias
        doc.addPage();
        this.agregarAnexoIncidencias(doc, estadisticas);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private agregarPortada(
    doc: PDFDocumentType,
    fechaInicio: Date,
    fechaFin: Date,
  ) {
    // Fondo de color (simulado con rectángulo)
    doc
      .rect(0, 0, 612, 792)
      .fillColor('#f5f5f5')
      .fill();

    // Título principal - estilo EMPRA-AIS
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text('REPORTE MENSUAL DE RIESGO', 50, 150, { align: 'center' });

    doc
      .fontSize(20)
      .font('Helvetica')
      .fillColor('#333333')
      .text('ANÁLISIS DE INSTALACIONES E INCIDENCIAS', 50, 200, {
        align: 'center',
      });

    // Período de cobertura
    const fechaFinFormateada = fechaFin.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const mesCobertura = fechaFin.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
    });
    doc
      .fontSize(14)
      .fillColor('#666666')
      .text(
        `${fechaFinFormateada} (Cobertura ${mesCobertura})`,
        50,
        280,
        { align: 'center' },
      );

    // Fecha de generación
    const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc
      .fontSize(11)
      .fillColor('#888888')
      .text(`Generado el: ${fechaGeneracion}`, 50, 320, { align: 'center' });

    // Línea decorativa
    doc
      .moveTo(100, 380)
      .lineTo(512, 380)
      .strokeColor('#cccccc')
      .lineWidth(2)
      .stroke();

    // Footer
    doc
      .fontSize(9)
      .fillColor('#999999')
      .text(
        '© 2025 AnaliticaVideoAPI. Todos los derechos reservados.',
        50,
        750,
        { align: 'center' },
      );
  }

  private agregarTablaContenido(doc: PDFDocumentType, numInstalaciones: number) {
    doc.addPage();
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a1a').text('Tabla de Contenido', 50, 50);

    let y = 100;
    const items = [
      'Resumen Ejecutivo',
      'Mapa de Ubicaciones de Equipos',
      'Estadísticas por Instalación Central',
      'Anexo: Incidencias Detalladas',
    ];

    items.forEach((item, index) => {
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#333333')
        .text(`${index + 1}. ${item}`, 70, y);
      y += 25;
    });
  }

  private async agregarResumenEjecutivo(
    doc: PDFDocumentType,
    estadisticas: any[],
    fechaInicio: Date,
    fechaFin: Date,
  ) {
    doc.addPage();
    
    // Título de sección con estilo
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text('Resumen Ejecutivo', 50, 50);

    // Línea decorativa bajo el título
    doc
      .moveTo(50, 75)
      .lineTo(200, 75)
      .strokeColor('#1a1a1a')
      .lineWidth(2)
      .stroke();

    let y = 100;

    // Total de instalaciones
    const totalInstalaciones = estadisticas.length;
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Instalaciones Centrales Monitoreadas:', 50, y);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`${totalInstalaciones}`, 300, y);
    y += 30;

    // Total de incidencias
    const totalIncidencias = estadisticas.reduce(
      (sum, stat) => sum + stat.totalIncidencias,
      0,
    );
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total de Incidencias Registradas:', 50, y);
    doc.fontSize(12).font('Helvetica').text(`${totalIncidencias}`, 300, y);
    y += 30;

    // Período de análisis
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Período de Análisis:', 50, y);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(
        `${this.formatearFecha(fechaInicio)} - ${this.formatearFecha(fechaFin)}`,
        300,
        y,
      );
    y += 40;

    // Resumen por estado de ánimo
    const estadoAnimoGlobal: Record<string, number> = {};
    estadisticas.forEach((stat) => {
      Object.keys(stat.incidenciasPorEstadoAnimo).forEach((estado) => {
        estadoAnimoGlobal[estado] =
          (estadoAnimoGlobal[estado] || 0) +
          stat.incidenciasPorEstadoAnimo[estado];
      });
    });

    if (Object.keys(estadoAnimoGlobal).length > 0) {
      y += 10;
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('Distribución por Estado de Ánimo:', 50, y);
      y += 25;

      // Tabla de estado de ánimo
      Object.entries(estadoAnimoGlobal)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .forEach(([estado, cantidad]) => {
          // Fondo alternado para filas
          const index = Object.keys(estadoAnimoGlobal).indexOf(estado);
          if (index % 2 === 0) {
            doc
              .rect(50, y - 5, 500, 18)
              .fillColor('#f9f9f9')
              .fill();
          }

          doc
            .fontSize(11)
            .font('Helvetica')
            .fillColor('#333333')
            .text(`${estado.charAt(0).toUpperCase() + estado.slice(1)}: ${cantidad}`, 70, y);
          y += 20;
        });
    }

    // Resumen por género
    const generoGlobal: Record<string, number> = {};
    estadisticas.forEach((stat) => {
      Object.keys(stat.incidenciasPorGenero).forEach((genero) => {
        generoGlobal[genero] =
          (generoGlobal[genero] || 0) + stat.incidenciasPorGenero[genero];
      });
    });

    if (Object.keys(generoGlobal).length > 0) {
      y += 20;
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('Distribución por Género:', 50, y);
      y += 25;

      Object.entries(generoGlobal).forEach(([genero, cantidad]) => {
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#333333')
          .text(`${genero.charAt(0).toUpperCase() + genero.slice(1)}: ${cantidad}`, 70, y);
        y += 20;
      });
    }

    // Agregar gráficas
    y += 30;
    await this.agregarGraficas(doc, estadisticas, y);
  }

  private async agregarGraficas(
    doc: PDFDocumentType,
    estadisticas: any[],
    startY: number,
  ) {
    try {
      // Recolectar todas las incidencias de todas las instalaciones
      const todasIncidencias: any[] = [];
      estadisticas.forEach((stat) => {
        if (stat.incidenciasDetalladas && stat.incidenciasDetalladas.length > 0) {
          todasIncidencias.push(...stat.incidenciasDetalladas);
        }
      });

      if (todasIncidencias.length === 0) {
        return;
      }

      let y = startY;

      // 1. Hit Actual (último hit)
      const ultimoHit = todasIncidencias[0]; // Ya están ordenados por fecha DESC
      if (ultimoHit) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1a1a1a')
          .text('Hit Actual', 50, y);
        y += 25;
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#333333')
          .text(
            `${ultimoHit.genero.charAt(0).toUpperCase() + ultimoHit.genero.slice(1)} | ${ultimoHit.edad} años | ${ultimoHit.estadoAnimo.charAt(0).toUpperCase() + ultimoHit.estadoAnimo.slice(1)}`,
            70,
            y,
          );
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text(`ID Registro: ${ultimoHit.id}`, 70, y + 20);
        y += 50;
      }

      // Calcular estadísticas globales
      const generoGlobal: Record<string, number> = {};
      const edadesGlobal: { rango: string; cantidad: number }[] = [];
      const edadesMujeres: { rango: string; cantidad: number }[] = [];
      const edadesHombres: { rango: string; cantidad: number }[] = [];
      const hitsPorHora: Array<{ hora: string; hombre: number; mujer: number }> = Array.from(
        { length: 24 },
        (_, i) => ({
          hora: `${i.toString().padStart(2, '0')}:00`,
          hombre: 0,
          mujer: 0,
        }),
      );

      // Rangos de edad
      const rangosEdad = [
        { min: 0, max: 20, label: '0 - 20' },
        { min: 21, max: 40, label: '21 - 40' },
        { min: 41, max: 60, label: '41 - 60' },
        { min: 61, max: 200, label: '61+' },
      ];

      todasIncidencias.forEach((inc: any) => {
        // Por género
        generoGlobal[inc.genero] = (generoGlobal[inc.genero] || 0) + 1;

        // Por rango de edad (todos)
        rangosEdad.forEach((rango) => {
          if (inc.edad >= rango.min && inc.edad <= rango.max) {
            const existente = edadesGlobal.find((e) => e.rango === rango.label);
            if (existente) {
              existente.cantidad++;
            } else {
              edadesGlobal.push({ rango: rango.label, cantidad: 1 });
            }
          }
        });

        // Por rango de edad (mujeres)
        if (inc.genero === 'mujer') {
          rangosEdad.forEach((rango) => {
            if (inc.edad >= rango.min && inc.edad <= rango.max) {
              const existente = edadesMujeres.find((e) => e.rango === rango.label);
              if (existente) {
                existente.cantidad++;
              } else {
                edadesMujeres.push({ rango: rango.label, cantidad: 1 });
              }
            }
          });
        }

        // Por rango de edad (hombres)
        if (inc.genero === 'hombre') {
          rangosEdad.forEach((rango) => {
            if (inc.edad >= rango.min && inc.edad <= rango.max) {
              const existente = edadesHombres.find((e) => e.rango === rango.label);
              if (existente) {
                existente.cantidad++;
              } else {
                edadesHombres.push({ rango: rango.label, cantidad: 1 });
              }
            }
          });
        }

        // Por hora
        if (inc.fecha) {
          const fecha = new Date(inc.fecha);
          const hora = fecha.getHours();
          if (inc.genero === 'hombre') {
            hitsPorHora[hora].hombre++;
          } else if (inc.genero === 'mujer') {
            hitsPorHora[hora].mujer++;
          }
        }
      });

      // 2. Conteo de Hits por Género
      if (Object.keys(generoGlobal).length > 0) {
        const totalPersonas = todasIncidencias.length;
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#1a1a1a')
          .text(`Conteo de Hits - Personas: ${totalPersonas}`, 50, y);
        y += 25;

        const chartGenero = await this.generarGraficaPastel(
          'Conteo de Hits',
          Object.keys(generoGlobal),
          Object.values(generoGlobal),
          ['#36A2EB', '#FF6384'], // Azul para hombres, rosa para mujeres
        );

        if (chartGenero) {
          doc.image(chartGenero, 50, y, { width: 240, height: 180 });
        }
        y += 200;
      }

      // 3. Conteo de Edades Ambos Géneros
      if (edadesGlobal.length > 0) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#1a1a1a')
          .text(
            `Conteo de Edades Ambos Géneros - Personas: ${todasIncidencias.length}`,
            320,
            startY + 50,
          );

        const chartEdades = await this.generarGraficaPastel(
          'Edades Ambos Géneros',
          edadesGlobal.map((e) => e.rango),
          edadesGlobal.map((e) => e.cantidad),
          ['#9966FF', '#4BC0C0', '#FFCE56', '#FF6384'], // Colores para rangos
        );

        if (chartEdades) {
          doc.image(chartEdades, 320, startY + 75, { width: 240, height: 180 });
        }
      }

      // Nueva página para más gráficas
      doc.addPage();
      y = 50;

      // 4. Segmentación por Edades Mujeres
      const totalMujeres = generoGlobal['mujer'] || 0;
      if (edadesMujeres.length > 0) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#1a1a1a')
          .text(`Segmentación por Edades Mujeres - Mujeres: ${totalMujeres}`, 50, y);
        y += 25;

        const chartMujeres = await this.generarGraficaPastel(
          'Edades Mujeres',
          edadesMujeres.map((e) => e.rango),
          edadesMujeres.map((e) => e.cantidad),
          ['#FF6384', '#FF9F40', '#FFCE56', '#FF6384'],
        );

        if (chartMujeres) {
          doc.image(chartMujeres, 50, y, { width: 240, height: 180 });
        }
        y += 200;
      }

      // 5. Segmentación por Edades Hombres
      const totalHombres = generoGlobal['hombre'] || 0;
      if (edadesHombres.length > 0 || totalHombres === 0) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#1a1a1a')
          .text(`Segmentación por Edades Hombres - Hombres: ${totalHombres}`, 320, 50);

        if (edadesHombres.length > 0) {
          const chartHombres = await this.generarGraficaPastel(
            'Edades Hombres',
            edadesHombres.map((e) => e.rango),
            edadesHombres.map((e) => e.cantidad),
            ['#36A2EB', '#4BC0C0', '#9966FF', '#C9CBCF'],
          );

          if (chartHombres) {
            doc.image(chartHombres, 320, 75, { width: 240, height: 180 });
          }
        }
      }

      // 6. Conteo de Hits por Hora (gráfica de barras horizontal)
      doc.addPage();
      y = 50;
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('Conteo de Hits por Hora', 50, y);
      y += 30;

      const chartHora = await this.generarGraficaBarrasHorizontal(hitsPorHora);
      if (chartHora) {
        doc.image(chartHora, 50, y, { width: 500, height: 400 });
      }
    } catch (error) {
      console.error('Error generando gráficas:', error);
      // Continuar sin gráficas si hay error
    }
  }

  private async generarGraficaPastel(
    titulo: string,
    labels: string[],
    data: number[],
    colores?: string[],
  ): Promise<Buffer | null> {
    try {
      const width = 400;
      const height = 300;
      const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

      const defaultColors = [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40',
        '#C9CBCF',
      ];

      const configuration = {
        type: 'pie' as const,
        data: {
          labels: labels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)),
          datasets: [
            {
              data: data,
              backgroundColor: colores || defaultColors.slice(0, labels.length),
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: titulo,
              font: {
                size: 14,
                weight: 'bold' as const,
              },
            },
            legend: {
              position: 'right' as const,
              labels: {
                boxWidth: 15,
                padding: 10,
              },
            },
          },
        },
      };

      const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
      return imageBuffer;
    } catch (error) {
      console.error('Error generando gráfica:', error);
      return null;
    }
  }

  private async generarGraficaBarrasHorizontal(
    datosPorHora: Array<{ hora: string; hombre: number; mujer: number }>,
  ): Promise<Buffer | null> {
    try {
      const width = 800;
      const height = 600;
      const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

      // Filtrar solo horas con datos
      const horasConDatos = datosPorHora.filter(
        (h) => h.hombre > 0 || h.mujer > 0,
      );

      if (horasConDatos.length === 0) {
        return null;
      }

      const configuration = {
        type: 'bar' as const,
        data: {
          labels: horasConDatos.map((h) => h.hora),
          datasets: [
            {
              label: 'Hombres',
              data: horasConDatos.map((h) => h.hombre),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
            {
              label: 'Mujeres',
              data: horasConDatos.map((h) => h.mujer),
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          indexAxis: 'y' as const, // Barras horizontales
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: 'Conteo de Hits por Hora',
              font: {
                size: 16,
                weight: 'bold' as const,
              },
            },
            legend: {
              position: 'top' as const,
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Cantidad de Hits',
              },
            },
            y: {
              title: {
                display: true,
                text: 'Hora',
              },
            },
          },
        },
      };

      const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
      return imageBuffer;
    } catch (error) {
      console.error('Error generando gráfica de barras:', error);
      return null;
    }
  }

  private async generarMapaEstatico(
    ubicacionesEquipos: InstalacionEquipo[],
  ): Promise<Buffer | null> {
    try {
      console.log(`[Mapa] Total de ubicaciones recibidas: ${ubicacionesEquipos.length}`);
      
      // Obtener coordenadas de todos los equipos instalados (no solo instalaciones centrales)
      const coordenadasEquipos: Array<{ lat: number; lng: number; nombre: string }> = [];
      const coordenadasInstalaciones: Array<{ lat: number; lng: number; nombre: string }> = [];
      const instalacionesMap = new Map<number, { lat: number; lng: number; nombre: string }>();

      ubicacionesEquipos.forEach((ubicacion) => {
        // Incluir equipos con coordenadas válidas
        if (ubicacion.lat && ubicacion.lng && !isNaN(ubicacion.lat) && !isNaN(ubicacion.lng) && ubicacion.lat !== 0 && ubicacion.lng !== 0) {
          const nombreEquipo = ubicacion.equipo?.numeroSerie || `Equipo ${ubicacion.idEquipo}`;
          coordenadasEquipos.push({
            lat: ubicacion.lat,
            lng: ubicacion.lng,
            nombre: nombreEquipo,
          });
        }
        
        // También incluir coordenadas de instalaciones centrales como respaldo
        if (ubicacion.instalacionCentral && ubicacion.idSedeCentral) {
          const key = ubicacion.idSedeCentral;
          if (!instalacionesMap.has(key)) {
            const instLat = ubicacion.instalacionCentral.lat;
            const instLng = ubicacion.instalacionCentral.lng;
            if (instLat && instLng && !isNaN(instLat) && !isNaN(instLng) && instLat !== 0 && instLng !== 0) {
              instalacionesMap.set(key, {
                lat: instLat,
                lng: instLng,
                nombre: ubicacion.instalacionCentral.nombre || `Instalación ${key}`,
              });
            }
          }
        }
      });

      // Agregar coordenadas de instalaciones centrales si no hay equipos con coordenadas
      coordenadasInstalaciones.push(...Array.from(instalacionesMap.values()));

      console.log(`[Mapa] Equipos con coordenadas válidas: ${coordenadasEquipos.length}`);
      console.log(`[Mapa] Instalaciones centrales con coordenadas válidas: ${coordenadasInstalaciones.length}`);

      // Usar coordenadas de equipos si están disponibles, sino usar instalaciones centrales
      const coordenadasFinales = coordenadasEquipos.length > 0 
        ? coordenadasEquipos 
        : coordenadasInstalaciones;

      if (coordenadasFinales.length === 0) {
        console.warn('[Mapa] No se encontraron coordenadas válidas ni en equipos ni en instalaciones centrales');
        return null;
      }

      console.log(`[Mapa] Usando ${coordenadasFinales.length} coordenadas para el mapa`);

      // Intentar usar Google Maps Static API si está disponible
      const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (googleMapsApiKey) {
        console.log('[Mapa] Usando Google Maps Static API');
        return await this.generarMapaGoogleMaps(coordenadasFinales);
      }

      // Fallback al método anterior si no hay API key
      console.log('[Mapa] Usando método de gráfico simple (sin API key de Google Maps)');
      const avgLat =
        coordenadasFinales.reduce((sum, c) => sum + c.lat, 0) / coordenadasFinales.length;
      const avgLng =
        coordenadasFinales.reduce((sum, c) => sum + c.lng, 0) / coordenadasFinales.length;
      return await this.generarMapaSimple(coordenadasFinales, avgLat, avgLng);
    } catch (error) {
      console.error('[Mapa] Error generando mapa estático:', error);
      return null;
    }
  }

  private async generarMapaGoogleMaps(
    coordenadasEquipos: Array<{ lat: number; lng: number; nombre: string }>,
  ): Promise<Buffer | null> {
    try {
      const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!googleMapsApiKey) {
        return null;
      }

      // Calcular centro del mapa
      const avgLat =
        coordenadasEquipos.reduce((sum, c) => sum + c.lat, 0) / coordenadasEquipos.length;
      const avgLng =
        coordenadasEquipos.reduce((sum, c) => sum + c.lng, 0) / coordenadasEquipos.length;

      // Calcular el zoom basado en la distribución de los equipos
      // Encontrar los límites geográficos
      const minLat = Math.min(...coordenadasEquipos.map((c) => c.lat));
      const maxLat = Math.max(...coordenadasEquipos.map((c) => c.lat));
      const minLng = Math.min(...coordenadasEquipos.map((c) => c.lng));
      const maxLng = Math.max(...coordenadasEquipos.map((c) => c.lng));

      // Calcular el rango de latitud y longitud
      const latRange = maxLat - minLat;
      const lngRange = maxLng - minLng;
      const maxRange = Math.max(latRange, lngRange);

      // Calcular zoom apropiado (zoom más alto = más cercano)
      // Ajustar el zoom para que el radio no sea muy grande
      let zoom = 15; // Zoom por defecto
      if (maxRange > 0.1) {
        zoom = 12; // Zoom más alejado para áreas grandes
      } else if (maxRange > 0.05) {
        zoom = 13;
      } else if (maxRange > 0.01) {
        zoom = 14;
      } else if (maxRange > 0.005) {
        zoom = 15;
      } else {
        zoom = 16; // Zoom más cercano para áreas pequeñas
      }

      // Construir la URL de Google Maps Static API con markers
      // Google Maps permite múltiples parámetros markers= para superar el límite de 50 por parámetro
      // Dividir en grupos de 50 markers cada uno
      const gruposMarkers: string[] = [];
      const maxMarkersPorGrupo = 50;
      
      for (let i = 0; i < coordenadasEquipos.length; i += maxMarkersPorGrupo) {
        const grupo = coordenadasEquipos.slice(i, i + maxMarkersPorGrupo)
          .map((coord, index) => {
            // Usar diferentes colores para los markers (rojo por defecto)
            const color = 'red';
            const labelIndex = i + index;
            const label = String.fromCharCode(65 + (labelIndex % 26)); // A, B, C, etc.
            return `color:${color}|label:${label}|${coord.lat},${coord.lng}`;
          })
          .join('|');
        gruposMarkers.push(grupo);
      }

      // Construir la URL con múltiples parámetros markers
      const markersParams = gruposMarkers
        .map((grupo) => `markers=${encodeURIComponent(grupo)}`)
        .join('&');

      const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${avgLat},${avgLng}&zoom=${zoom}&size=800x600&maptype=roadmap&${markersParams}&key=${googleMapsApiKey}`;

      // Descargar la imagen del mapa
      console.log(`[Google Maps] Descargando mapa desde: ${mapUrl.substring(0, 100)}...`);
      const response = await axios.get(mapUrl, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data);
      console.log(`[Google Maps] Mapa descargado exitosamente, tamaño: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error('[Google Maps] Error generando mapa con Google Maps:', error);
      if (error.response) {
        console.error('[Google Maps] Respuesta del error:', error.response.status, error.response.statusText);
      }
      // Fallback al método simple si falla Google Maps
      const avgLat =
        coordenadasEquipos.reduce((sum, c) => sum + c.lat, 0) / coordenadasEquipos.length;
      const avgLng =
        coordenadasEquipos.reduce((sum, c) => sum + c.lng, 0) / coordenadasEquipos.length;
      return await this.generarMapaSimple(coordenadasEquipos, avgLat, avgLng);
    }
  }

  private async generarMapaSimple(
    coordenadas: Array<{ lat: number; lng: number; nombre: string }>,
    centerLat: number,
    centerLng: number,
  ): Promise<Buffer | null> {
    try {
      console.log(`[Mapa Simple] Generando gráfico con ${coordenadas.length} coordenadas`);
      const width = 800;
      const height = 600;
      const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

      // Calcular posiciones relativas
      const minLat = Math.min(...coordenadas.map((c) => c.lat));
      const maxLat = Math.max(...coordenadas.map((c) => c.lat));
      const minLng = Math.min(...coordenadas.map((c) => c.lng));
      const maxLng = Math.max(...coordenadas.map((c) => c.lng));

      // Si todos los puntos están en el mismo lugar, usar un rango mínimo
      let latRange = maxLat - minLat;
      let lngRange = maxLng - minLng;
      
      if (latRange === 0 || isNaN(latRange)) {
        latRange = 0.01; // Rango mínimo de ~1km
      }
      if (lngRange === 0 || isNaN(lngRange)) {
        lngRange = 0.01; // Rango mínimo de ~1km
      }
      
      console.log(`[Mapa Simple] Rango lat: ${latRange}, lng: ${lngRange}`);

      // Convertir coordenadas a puntos en el gráfico
      const puntos = coordenadas.map((coord, index) => {
        // Normalizar las coordenadas al rango 0-100
        const x = lngRange > 0 ? ((coord.lng - minLng) / lngRange) * 100 : 50;
        const y = latRange > 0 ? ((maxLat - coord.lat) / latRange) * 100 : 50;
        return {
          x: isNaN(x) ? 50 : Math.max(0, Math.min(100, x)), // Asegurar que esté en el rango
          y: isNaN(y) ? 50 : Math.max(0, Math.min(100, y)), // Asegurar que esté en el rango
          label: `${index + 1}`,
        };
      });
      
      console.log(`[Mapa Simple] Puntos generados: ${puntos.length}`);

      // Crear gráfico de dispersión
      const configuration = {
        type: 'scatter' as const,
        data: {
          datasets: [
            {
              label: 'Ubicaciones',
              data: puntos,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              pointRadius: 10,
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: 'Mapa de Ubicaciones de Equipos Instalados',
              font: {
                size: 16,
                weight: 'bold' as const,
              },
            },
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Longitud',
              },
              min: 0,
              max: 100,
            },
            y: {
              title: {
                display: true,
                text: 'Latitud',
              },
              min: 0,
              max: 100,
            },
          },
        },
      };

      const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
      console.log(`[Mapa Simple] Gráfico generado exitosamente, tamaño: ${imageBuffer.length} bytes`);
      return imageBuffer;
    } catch (error) {
      console.error('[Mapa Simple] Error generando mapa simple:', error);
      return null;
    }
  }

  private async agregarMapa(
    doc: PDFDocumentType,
    ubicacionesEquipos: InstalacionEquipo[],
  ) {
    doc.addPage();
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text('Mapa de Ubicaciones de Equipos Instalados', 50, 50);

    let y = 100;

    // Generar mapa estático
    try {
      console.log(`[Mapa] Iniciando generación de mapa con ${ubicacionesEquipos.length} ubicaciones`);
      const mapaBuffer = await this.generarMapaEstatico(ubicacionesEquipos);
      if (mapaBuffer) {
        console.log(`[Mapa] Mapa generado exitosamente, tamaño del buffer: ${mapaBuffer.length} bytes`);
        doc.image(mapaBuffer, 50, y, { width: 500, height: 400 });
        y += 420;
      } else {
        console.warn('[Mapa] No se pudo generar el mapa (buffer es null)');
        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor('#666666')
          .text('No se pudo generar el mapa. Verifique que los equipos tengan coordenadas válidas.', 50, y, { width: 500 });
        y += 50;
      }
    } catch (error) {
      console.error('[Mapa] Error generando mapa:', error);
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#ff0000')
        .text(`Error al generar el mapa: ${error.message}`, 50, y, { width: 500 });
      y += 50;
    }

    // Obtener instalaciones centrales únicas con sus coordenadas
    const instalacionesMap = new Map<
      number,
      { nombre: string; lat: number; lng: number; equipos: any[] }
    >();

    ubicacionesEquipos.forEach((ubicacion) => {
      if (ubicacion.idSedeCentral && ubicacion.instalacionCentral) {
        const key = ubicacion.idSedeCentral;
        if (!instalacionesMap.has(key)) {
          instalacionesMap.set(key, {
            nombre:
              ubicacion.instalacionCentral.nombre ||
              `Instalación ${key}`,
            lat: ubicacion.instalacionCentral.lat,
            lng: ubicacion.instalacionCentral.lng,
            equipos: [],
          });
        }
        if (ubicacion.equipo) {
          instalacionesMap.get(key)!.equipos.push({
            numeroSerie: ubicacion.equipo.numeroSerie,
            lat: ubicacion.lat,
            lng: ubicacion.lng,
          });
        }
      }
    });

    // Crear tabla de ubicaciones
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Distribución Geográfica de Instalaciones:', 50, y);
    y += 30;

    // Encabezados de tabla
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Instalación Central', 50, y)
      .text('Coordenadas', 250, y)
      .text('Equipos', 400, y);
    y += 20;

    // Línea separadora
    doc
      .moveTo(50, y)
      .lineTo(550, y)
      .strokeColor('#cccccc')
      .lineWidth(1)
      .stroke();
    y += 15;

    // Datos de la tabla
    instalacionesMap.forEach((instalacion, idSede) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        // Reimprimir encabezados
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#333333')
          .text('Instalación Central', 50, y)
          .text('Coordenadas', 250, y)
          .text('Equipos', 400, y);
        y += 20;
        doc
          .moveTo(50, y)
          .lineTo(550, y)
          .strokeColor('#cccccc')
          .lineWidth(1)
          .stroke();
        y += 15;
      }

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(instalacion.nombre, 50, y, { width: 180 })
        .text(
          `Lat: ${instalacion.lat.toFixed(6)}\nLng: ${instalacion.lng.toFixed(6)}`,
          250,
          y,
          { width: 140 },
        )
        .text(`${instalacion.equipos.length}`, 400, y);
      y += 30;
    });

    // Resumen de coordenadas para mapa
    y += 20;
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text('Coordenadas para Visualización en Mapa:', 50, y);
    y += 25;

    const coordenadas = Array.from(instalacionesMap.values()).map((inst) => ({
      nombre: inst.nombre,
      lat: inst.lat,
      lng: inst.lng,
    }));

    coordenadas.slice(0, 15).forEach((coord) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#333333')
        .text(
          `${coord.nombre}: ${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`,
          70,
          y,
        );
      y += 18;
    });

    if (coordenadas.length > 15) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text(
          `... y ${coordenadas.length - 15} instalaciones más`,
          70,
          y,
        );
    }

    // Nota sobre el mapa
    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor('#999999')
      .text(
        'Nota: Las coordenadas pueden ser utilizadas para generar un mapa interactivo en el sistema web o mediante servicios de mapas como Google Maps.',
        50,
        720,
        { width: 500 },
      );
  }

  private agregarEstadisticasInstalacion(
    doc: PDFDocumentType,
    stat: any,
    numero: number,
  ) {
    const { instalacion } = stat;
    const cliente = instalacion.cliente;

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text(`Instalación Central #${numero}`, 50, 50);

    let y = 90;

    // Información de la instalación
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Información de la Instalación:', 50, y);
    y += 25;

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Nombre: ${instalacion.nombre || 'N/A'}`, 70, y);
    y += 20;

    if (cliente) {
      const nombreCliente = [
        cliente.nombre,
        cliente.apellidoPaterno,
        cliente.apellidoMaterno,
      ]
        .filter(Boolean)
        .join(' ');
      doc.text(`Cliente: ${nombreCliente}`, 70, y);
      y += 20;
    }

    doc.text(`Coordenadas: Lat ${instalacion.lat}, Lng ${instalacion.lng}`, 70, y);
    y += 20;

    if (instalacion.nroPisos) {
      doc.text(`Número de Pisos: ${instalacion.nroPisos}`, 70, y);
      y += 20;
    }

    y += 20;

    // Estadísticas de incidencias
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Estadísticas de Incidencias:', 50, y);
    y += 25;

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Total de Incidencias: ${stat.totalIncidencias}`, 70, y);
    y += 25;

    // Por estado de ánimo
    if (Object.keys(stat.incidenciasPorEstadoAnimo).length > 0) {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Por Estado de Ánimo:', 70, y);
      y += 20;

      Object.entries(stat.incidenciasPorEstadoAnimo)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .forEach(([estado, cantidad]) => {
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(`  ${estado}: ${cantidad}`, 90, y);
          y += 18;
        });
      y += 10;
    }

    // Por género
    if (Object.keys(stat.incidenciasPorGenero).length > 0) {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Por Género:', 70, y);
      y += 20;

      Object.entries(stat.incidenciasPorGenero).forEach(([genero, cantidad]) => {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`  ${genero}: ${cantidad}`, 90, y);
        y += 18;
      });
      y += 10;
    }

    // Por rango de edad
    if (stat.incidenciasPorEdad.length > 0) {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Por Rango de Edad:', 70, y);
      y += 20;

      stat.incidenciasPorEdad.forEach((item: any) => {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`  ${item.rango} años: ${item.cantidad}`, 90, y);
        y += 18;
      });
    }
  }

  private agregarAnexoIncidencias(doc: PDFDocumentType, estadisticas: any[]) {
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text('Anexo: Incidencias Detalladas', 50, 50);

    let y = 100;

    estadisticas.forEach((stat, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(
          `Instalación: ${stat.instalacion.nombre || `ID ${stat.instalacion.id}`}`,
          50,
          y,
        );
      y += 25;

      if (stat.incidenciasDetalladas.length === 0) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#666666')
          .text('  No hay incidencias registradas en el período.', 70, y);
        y += 30;
      } else {
        stat.incidenciasDetalladas.forEach((inc: any) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          const fechaStr = this.formatearFechaHora(inc.fecha);
          doc
            .fontSize(9)
            .font('Helvetica')
            .text(
              `  ${fechaStr} | ${inc.genero} | ${inc.edad} años | ${inc.estadoAnimo} | Equipo: ${inc.idDispositivo}`,
              70,
              y,
            );
          y += 15;
        });
        y += 10;
      }
    });
  }

  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatearFechaHora(fecha: Date | string): string {
    const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return d.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
