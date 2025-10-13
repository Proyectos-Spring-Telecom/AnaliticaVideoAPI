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
import { CatMarca } from './CatMarcas';

  
  @Entity('CatModelos')
  export class CatModelos {
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
      comment: 'Nombre del modelo',
    })
    nombre: string;
  
    @Column({
      name: 'Estatus',
      type: 'int',
      default: 1,
      comment: 'Estatus del modelo (1 Activo, 0 Inactivo)',
    })
    estatus: number;
  
    @Column({
      name: 'IdMarca',
      type: 'int',
      nullable: false,
      comment: 'Marca del modelo',
    })
    idMarca: number;
  
    @Column({
      name: 'IdProducto',
      type: 'int',
      nullable: false,
      comment: 'Tipo de producto',
    })
    idProducto: number;
  
    // 🔗 Relación con CatMarca
    @ManyToOne(() => CatMarca, (marca) => marca.modelos, {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'IdMarca' })
    marca: CatMarca;
  
    // 🔗 Relación con CatProducto
    @ManyToOne(() => CatProducto, (producto) => producto.modelos, {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'IdProducto' })
    producto: CatProducto;
  }
  