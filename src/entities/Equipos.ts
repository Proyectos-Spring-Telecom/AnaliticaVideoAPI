import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
  } from 'typeorm';
  import { CatModelos } from './CatModelos';
import { Clientes } from './Clientes';
import { InstalacionEquipo } from './InstalacionEquipo';
  
  @Entity('Equipos')
  export class Equipos {
    @PrimaryGeneratedColumn({
      name: 'Id',
      type: 'bigint',
      comment: 'Primary Key',
    })
    id: number;
  
    @CreateDateColumn({
      name: 'FechaCreacion',
      type: 'datetime',
      default: () => 'CURRENT_TIMESTAMP',
      comment: 'Fecha de creación',
    })
    fechaCreacion: Date;
  
    @UpdateDateColumn({
      name: 'FechaActualizacion',
      type: 'datetime',
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
      comment: 'Fecha de última actualización',
    })
    fechaActualizacion: Date;
  
    @Column({
      name: 'NumeroSerie',
      type: 'varchar',
      length: 255,
      nullable: false,
      comment: 'Número de serie del equipo',
    })
    numeroSerie: string;
  
    @Column({
      name: 'Estatus',
      type: 'int',
      default: 1,
      comment: 'Estatus del equipo (1 Activo, 0 Inactivo)',
    })
    estatus: number;
  
    @Column({
      name: 'IdCliente',
      type: 'bigint',
      nullable: false,
      comment: 'Cliente dueño del equipo',
    })
    idCliente: number;
  
    @Column({
      name: 'IP',
      type: 'varchar',
      length: 100,
      nullable: true,
      comment: 'IP del equipo',
    })
    ip: string | null;
  
    @Column({
      name: 'IdModelo',
      type: 'int',
      nullable: false,
      comment: 'Modelo del equipo',
    })
    idModelo: number;
    @Column({
      name: 'IdEstadoEquipo',
      type: 'int',
      nullable: false,
      comment: 'Estado del equipo',
    })
    idEstadoEquipo: number;
  
    // 🔗 Relación con CatModelos
    @ManyToOne(() => CatModelos, (modelo) => modelo.id, {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'IdModelo' })
    modelo: CatModelos;

  // 🔗 Relación con Clientes
  @ManyToOne(() => Clientes, (cliente) => cliente.equipos, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'IdCliente' })
  cliente: Clientes;

    @OneToMany(() => InstalacionEquipo, (instalacion) => instalacion.equipo)
  instalacionesEquipo: InstalacionEquipo[];
  }
  