import { applySchema } from 'src/utils/schema';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
  } from 'typeorm';
import { CatMarca } from './CatMarcas';
import { CatModelos } from './CatModelos';
  
  @Entity('CatProducto')
  @applySchema
  export class CatProducto {
    @PrimaryGeneratedColumn({ name: 'Id', comment: 'Primary Key' })
    id: number;

  
    @CreateDateColumn({
      name: 'FechaCreacion',
      type: 'datetime',
      comment: 'Fecha de creación',
      default: () => 'CURRENT_TIMESTAMP',
    })
    fechaCreacion: Date;
  
    @UpdateDateColumn({
      name: 'FechaActualizacion',
      type: 'datetime',
      comment: 'Fecha de última actualización',
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
    })
    fechaActualizacion: Date;
  
    @Column({
      name: 'Nombre',
      type: 'varchar',
      length: 255,
      nullable: false,
      comment: 'Nombre del producto',
    })
    nombre: string;

    @Column({
      name: 'Estatus',
      type: 'varchar',
      length: 255,
      nullable: false,
      comment: 'Estatus del producto',
    })
    estatus: number;

  @OneToMany(() => CatMarca, (marca) => marca.producto)
  marcas: CatMarca[];

  @OneToMany(() => CatModelos, (modelo) => modelo.producto)
modelos: CatModelos[];
  }
  