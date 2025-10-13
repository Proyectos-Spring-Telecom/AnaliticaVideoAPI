import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
import { CatProducto } from './CatProducto';
import { CatModelos } from './CatModelos';
import { OneToMany } from 'typeorm/browser';
  
  @Entity('CatMarcas')
  export class CatMarca {
    @PrimaryGeneratedColumn({ name: 'Id', comment: 'Primary Key' })
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
      name: 'Nombre',
      type: 'varchar',
      length: 255,
      nullable: false,
      comment: 'Nombre de la marca',
    })
    nombre: string;
  
    @Column({
      name: 'Estatus',
      type: 'int',
      default: 1,
      comment: 'Estatus de la marca (1 Activo, 0 Inactivo)',
    })
    estatus: number;
  
    @Column({
      name: 'IdProducto',
      type: 'int',
      nullable: true,
      comment: 'Relación con CatProducto',
    })
    idProducto: number;
  
    @ManyToOne(() => CatProducto, (producto) => producto.marcas, {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'IdProducto' })
    producto: CatProducto;

    @OneToMany(() => CatModelos, (modelo) => modelo.marca)
modelos: CatModelos[];
  }
  