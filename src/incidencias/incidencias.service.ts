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
      // Preparar la fecha: quitar el 'Z' o offset de zona horaria para que MySQL la interprete como hora local
      let fechaParaBD: string;
      if (createIncidenciaDto.fecha) {
        // Quitar 'Z', '+00:00', '-06:00', etc. y dejar solo la fecha y hora
        fechaParaBD = createIncidenciaDto.fecha.replace('T', ' ').replace(/[Z+-]\d{2}:\d{2}$/, '').substring(0, 19);
      } else {
        // Si no viene fecha, usar la actual en formato local
        const ahora = new Date();
        fechaParaBD = ahora.toISOString().replace('T', ' ').substring(0, 19);
      }
      
      const query = `
        INSERT INTO Incidencias (Genero, Edad, EstadoAnimo, TiempoEnEscena, Foto, FotoProceso, Fecha, IdDispositivo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await this.incidenciaRepository.query(query, [
        createIncidenciaDto.genero,
        createIncidenciaDto.edad,
        createIncidenciaDto.estadoAnimo,
        createIncidenciaDto.tiempoEnEscena || null,
        createIncidenciaDto.foto || null,
        createIncidenciaDto.fotoProceso || null,
        fechaParaBD,
        createIncidenciaDto.idDispositivo,
      ]);
      
      // Obtener la incidencia creada
      const created = await this.incidenciaRepository.findOne({
        where: { id: result.insertId }
      });
      
      if (!created) {
        throw new BadRequestException('Error al crear la incidencia');
      }
      
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
      this.incidenciasGateway.emitNuevaIncidencia(incidenciaFormateada);
      
      return created;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getIncidencias(numeroSerie: string) {
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
        .andWhere('i.idDispositivo = :numeroSerie', { numeroSerie })
        .orderBy('i.fecha', 'DESC')
        .getRawMany();

      return incidencias;
    } catch (error) {
      throw new InternalServerErrorException('Error consultando incidencias');
    }
  }

  async findUltimoHit(numeroSerie: string): Promise<any> {
    try {
      const incidencia = await this.incidenciaRepository.find({
        where: { idDispositivo: numeroSerie },
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

    async findByRango(numeroSerie: string, fechaInicio: string, fechaFin: string): Promise<any[]> {
    try {
      if (!fechaInicio || !fechaFin) {
        throw new BadRequestException(
          'Se requieren fechaInicio y fechaFin en formato YYYY-MM-DD',
        );
      }

      // Crear rango con horas extremas
      const inicio = new Date(`${fechaInicio} 00:00:00`);
      const fin = new Date(`${fechaFin} 23:59:59`);

      // Buscar incidencias en el rango filtradas por idDispositivo
      const incidencias = await this.incidenciaRepository.find({
        where: { 
          fecha: Between(inicio, fin),
          idDispositivo: numeroSerie
        },
        order: { fecha: 'DESC' },
      });

      // Formatear salida en formato YYYY-MM-DD HH:mm:ss
      return incidencias.map((i) => {
        let fechaFormateada: string | null = null;
        if (i.fecha) {
          const fecha = new Date(i.fecha);
          
          // Obtener componentes de fecha en zona horaria de México
          const año = fecha.toLocaleString('en-US', { year: 'numeric', timeZone: 'America/Mexico_City' });
          const mes = fecha.toLocaleString('en-US', { month: '2-digit', timeZone: 'America/Mexico_City' });
          const dia = fecha.toLocaleString('en-US', { day: '2-digit', timeZone: 'America/Mexico_City' });
          const horas = fecha.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: 'America/Mexico_City' });
          const minutos = fecha.toLocaleString('en-US', { minute: '2-digit', timeZone: 'America/Mexico_City' });
          const segundos = fecha.toLocaleString('en-US', { second: '2-digit', timeZone: 'America/Mexico_City' });
          
          fechaFormateada = `${año}-${mes}-${dia} ${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}:${segundos.padStart(2, '0')}`;
        }
        
        return {
          id: i.id,
          genero: i.genero,
          edad: i.edad,
          estadoAnimo: i.estadoAnimo,
          idDispositivo: i.idDispositivo,
          tiempoEnEscena: i.tiempoEnEscena,
          foto: i.foto,
          fecha: fechaFormateada,
        };
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error consultando incidencias');
    }
  }

  async findByRangoPaginado(
    numeroSerie: string,
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

      // Consulta principal filtrada por idDispositivo
      const [data, total] = await this.incidenciaRepository.findAndCount({
        where: { 
          fecha: Between(inicio, fin),
          idDispositivo: numeroSerie
        },
        order: { fecha: 'DESC' },
        skip,
        take: limit,
      });

      // Formatear fechas en formato YYYY-MM-DD HH:mm:ss
      const formattedData = data.map((i) => {
        let fechaFormateada: string | null = null;
        if (i.fecha) {
          const fecha = new Date(i.fecha);
          
          // Obtener componentes de fecha en zona horaria de México
          const año = fecha.toLocaleString('en-US', { year: 'numeric', timeZone: 'America/Mexico_City' });
          const mes = fecha.toLocaleString('en-US', { month: '2-digit', timeZone: 'America/Mexico_City' });
          const dia = fecha.toLocaleString('en-US', { day: '2-digit', timeZone: 'America/Mexico_City' });
          const horas = fecha.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: 'America/Mexico_City' });
          const minutos = fecha.toLocaleString('en-US', { minute: '2-digit', timeZone: 'America/Mexico_City' });
          const segundos = fecha.toLocaleString('en-US', { second: '2-digit', timeZone: 'America/Mexico_City' });
          
          fechaFormateada = `${año}-${mes}-${dia} ${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}:${segundos.padStart(2, '0')}`;
        }
        
        return {
          id: i.id,
          genero: i.genero,
          edad: i.edad,
          estadoAnimo: i.estadoAnimo,
          idDispositivo: i.idDispositivo,
          tiempoEnEscena: i.tiempoEnEscena,
          foto: i.foto,
          fecha: fechaFormateada,
        };
      });

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

    async findPorHora(numeroSerie: string, fecha: string): Promise<any[]> {
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
          WHERE DATE(fecha) = ? AND IdDispositivo = ?
          GROUP BY genero, hora
          ORDER BY hora ASC
        `,
        [fecha, numeroSerie],
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

  async findPorHoraRango(numeroSerie: string, fechaInicio: string, fechaFin: string): Promise<any[]> {
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
          WHERE DATE(fecha) BETWEEN ? AND ? AND IdDispositivo = ?
          GROUP BY genero, hora
          ORDER BY hora ASC
        `,
        [fechaInicio, fechaFin, numeroSerie],
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
