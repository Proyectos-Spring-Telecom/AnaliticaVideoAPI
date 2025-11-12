import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
  } from 'typeorm';
  
  @Entity('Incidencias')
  export class Incidencia {
    @PrimaryGeneratedColumn({ name: 'Id' })
    id: number;
  
    @Column({
      name: 'Genero',
      type: 'enum',
      enum: ['hombre', 'mujer'],
      nullable: false,
    })
    genero: 'hombre' | 'mujer';
  
    @Column({
      name: 'Edad',
      type: 'int',
      nullable: false,
    })
    edad: number;
  
    @Column({
      name: 'EstadoAnimo',
      type: 'enum',
      enum: [
        'feliz',
        'neutral',
        'sorprendido',
        'triste',
        'molesto',
        'disgustado',
        'asustado',
        'despectivo',
      ],
      nullable: false,
    })
    estadoAnimo:
      | 'feliz'
      | 'neutral'
      | 'sorprendido'
      | 'triste'
      | 'molesto'
      | 'disgustado'
      | 'asustado'
      | 'despectivo';
  
    @Column({
      name: 'TiempoEnEscena',
      type: 'int',
      nullable: true,
    })
    tiempoEnEscena?: number;
  
    @Column({
      name: 'Foto',
      type: 'varchar',
      length: 255,
      nullable: true,
    })
    foto?: string;
  
    @Column({
      name: 'FotoProceso',
      type: 'varchar',
      length: 255,
      nullable: true,
    })
    fotoProceso?: string;
  
    @Column({
      name: 'Fecha',
      type: 'timestamp',
      nullable: false,
    })
    fecha: Date;
  
    @Column({
      name: 'IdDispositivo',
      type: 'varchar',
      length: 32,
      nullable: false,
    })
    idDispositivo: string;
  }
  