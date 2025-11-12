import { BadRequestException, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Incidencia } from "src/entities/Incidencias";
import { Between, Repository } from "typeorm";
import { CreateIncidenciaDto } from "./dto/create-incidencia.dto";
import { IncidenciasGateway } from "./incidencias.gateway";

@Injectable()
export class IncidenciasService {
  constructor(
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>,
    private readonly incidenciasGateway: IncidenciasGateway
  ) { }

  async create(createIncidenciaDto: CreateIncidenciaDto, idUser: number) {
    try {
      console.log('[Service] Creando nueva incidencia...');
      const save = await this.incidenciaRepository.create(createIncidenciaDto);
      const created = await this.incidenciaRepository.save(save);
      console.log('[Service] Incidencia creada con ID:', created.id);
      
      // Formatear la incidencia para el evento
      const incidenciaFormateada = {
        id: created.id,
        genero: created.genero,
        edad: created.edad,
        estadoAnimo: created.estadoAnimo,
        idDispositivo: created.idDispositivo,
        tiempoEnEscena: created.tiempoEnEscena,
        foto: created.foto,
        fecha: created.fecha
          ? new Date(created.fecha).toLocaleString('es-MX', {
              timeZone: 'America/Mexico_City',
              hour12: false
            }).replace(',', '')
          : null,
      };
      
      // Emitir evento de nueva incidencia a través de socket.io
      console.log('[Service] Intentando emitir evento socket...');
      this.incidenciasGateway.emitNuevaIncidencia(incidenciaFormateada);
      console.log('[Service] Evento socket llamado');
      
      return created;
    } catch (error) {
      console.error('[Service] Error al crear incidencia:', error);
      throw new BadRequestException(error);
    }
  }

  async getIncidencias() {
    try {
      const incidencias = await this.incidenciaRepository
        .createQueryBuilder('i')
        .select([
          'i.id AS id',
          'i.genero AS genero',
          'i.edad AS edad',
          'i.estadoAnimo AS estadoAnimo',
          'i.idDispositivo AS idDispositivo',
          'i.tiempoEnEscena AS tiempoEnEscena',
          'i.foto AS foto',
          'DATE_FORMAT(i.fecha, "%Y-%m-%d %H:%i:%s") AS fecha',
        ])
        .where('i.fecha >= CURDATE()')
        .orderBy('i.fecha', 'DESC')
        .getRawMany();

      return incidencias;
    } catch (error) {
      throw new InternalServerErrorException('Error consultando incidencias');
    }
  }

  async findUltimoHit(): Promise<any> {
    try {
      const incidencia = await this.incidenciaRepository.find({
        order: { fecha: 'DESC' },
        take: 1,
      });
      console.log(incidencia,"hit")
      if (incidencia.length === 0) return null;

      const i = incidencia[0];
      return {
        id: i.id,
        genero: i.genero,
        edad: i.edad,
        estadoAnimo: i.estadoAnimo,
        idDispositivo: i.idDispositivo,
        tiempoEnEscena: i.tiempoEnEscena,
        foto: i.foto,
        fecha: i.fecha
          ? new Date(i.fecha).toLocaleString('es-MX', {
            timeZone: 'America/Mexico_City',
            hour12: false
          }).replace(',', '')
          : null,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error obteniendo el último hit');
    }
  }

    async findByRango(fechaInicio: string, fechaFin: string): Promise<any[]> {
    try {
      if (!fechaInicio || !fechaFin) {
        throw new BadRequestException(
          'Se requieren fechaInicio y fechaFin en formato YYYY-MM-DD',
        );
      }

      // Crear rango con horas extremas
      const inicio = new Date(`${fechaInicio} 00:00:00`);
      const fin = new Date(`${fechaFin} 23:59:59`);

      // Buscar incidencias en el rango
      const incidencias = await this.incidenciaRepository.find({
        where: { fecha: Between(inicio, fin) },
        order: { fecha: 'DESC' },
      });

      // Formatear salida
      return incidencias.map((i) => ({
        id: i.id,
        genero: i.genero,
        edad: i.edad,
        estadoAnimo: i.estadoAnimo,
        idDispositivo: i.idDispositivo,
        tiempoEnEscena: i.tiempoEnEscena,
        foto: i.foto,
        fecha: i.fecha
          ? new Date(i.fecha)
              .toLocaleString('es-MX', {
                timeZone: 'America/Mexico_City',
                hour12: false,
              })
              .replace(',', '')
          : null,
      }));
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error consultando incidencias');
    }
  }

  async findByRangoPaginado(
    fechaInicio: string,
    fechaFin: string,
    page: number ,
    limit: number ,
  ): Promise<any> {
    try {
      if (!fechaInicio || !fechaFin) {
        throw new BadRequestException(
          'Se requieren fechaInicio y fechaFin en formato YYYY-MM-DD',
        );
      }

      if (page < 1 || limit < 1) {
        throw new BadRequestException(
          'Los parámetros page y limit deben ser mayores que cero',
        );
      }

      const inicio = new Date(`${fechaInicio} 00:00:00`);
      const fin = new Date(`${fechaFin} 23:59:59`);
      const skip = (page - 1) * limit;

      // Consulta principal
      const [data, total] = await this.incidenciaRepository.findAndCount({
        where: { fecha: Between(inicio, fin) },
        order: { fecha: 'DESC' },
        skip,
        take: limit,
      });

      // Formatear fechas al horario local de México
      const formattedData = data.map((i) => ({
        id: i.id,
        genero: i.genero,
        edad: i.edad,
        estadoAnimo: i.estadoAnimo,
        idDispositivo: i.idDispositivo,
        tiempoEnEscena: i.tiempoEnEscena,
        foto: i.foto,
        fecha: i.fecha
          ? new Date(i.fecha)
              .toLocaleString('es-MX', {
                timeZone: 'America/Mexico_City',
                hour12: false,
              })
              .replace(',', '')
          : null,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        data: formattedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error consultando incidencias:', error);
      throw new InternalServerErrorException('Error consultando incidencias');
    }
  }

    async findPorHora(fecha: string): Promise<any[]> {
    try {
      if (!fecha) {
        throw new BadRequestException('Fecha requerida en formato YYYY-MM-DD');
      }

      // Ejecutar SQL crudo, ya que TypeORM no agrupa por hora fácilmente sin QB
      const results = await this.incidenciaRepository.query(
        `
          SELECT 
            HOUR(fecha) AS hora,
            genero,
            COUNT(*) AS cantidad
          FROM Incidencias
          WHERE DATE(fecha) = ?
          GROUP BY genero, hora
          ORDER BY hora ASC
        `,
        [fecha],
      );

      // Estructura de salida: 00 a 23 horas
      const horas = Array.from({ length: 24 }, (_, i) => ({
        hora: `${i.toString().padStart(2, '0')}:00`,
        hombre: 0,
        mujer: 0,
      }));

      results.forEach((row: any) => {
        const index = parseInt(row.hora, 10);
        const genero = row.genero?.toLowerCase();
        if (genero === 'hombre' || genero === 'mujer') {
          horas[index][genero] = row.cantidad;
        }
      });

      return horas;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error consultando incidencias por hora:', error);
      throw new InternalServerErrorException(
        'Error consultando incidencias por hora',
      );
    }
  }

  async findPorHoraRango(fechaInicio: string, fechaFin: string): Promise<any[]> {
    try {
      if (!fechaInicio || !fechaFin) {
        throw new BadRequestException(
          'Se requieren las fechas de inicio y fin en formato YYYY-MM-DD',
        );
      }

      const results = await this.incidenciaRepository.query(
        `
          SELECT 
              HOUR(fecha) AS hora,
              genero,
              COUNT(*) AS cantidad
          FROM Incidencias
          WHERE DATE(fecha) BETWEEN ? AND ?
          GROUP BY genero, hora
          ORDER BY hora ASC
        `,
        [fechaInicio, fechaFin],
      );

      // Generar estructura 00:00 a 23:00
      const horas = Array.from({ length: 24 }, (_, i) => ({
        hora: `${i.toString().padStart(2, '0')}:00`,
        hombre: 0,
        mujer: 0,
      }));

      results.forEach((row: any) => {
        const index = parseInt(row.hora, 10);
        const genero = row.genero?.toLowerCase();
        if (index >= 0 && index <= 23) {
          if (genero === 'hombre' || genero === 'mujer') {
            horas[index][genero] = row.cantidad;
          }
        }
      });

      return horas;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error consultando incidencias por hora en rango:', error);
      throw new InternalServerErrorException(
        'Error consultando incidencias por hora en rango',
      );
    }
  }

}
