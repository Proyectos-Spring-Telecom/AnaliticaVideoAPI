import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('CatEstadoEquipo')
  export class CatEstadoEquipo {
    @PrimaryGeneratedColumn({ name: 'Id', comment: 'Primary Key' })
    id: number;
    @Column({
        name: 'Nombre',
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Nombre del estado',
      })
      nombre: string;
  }