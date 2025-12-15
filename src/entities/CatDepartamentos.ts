import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Clientes } from "./Clientes";
import { InstalacionEquipo } from "./InstalacionEquipo";

@Entity({ name: "CatDepartamentos" })
export class CatDepartamentos {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Id" })
  id: number;

  @Column({ type: "varchar", name: "Nombre", length: 150, nullable: false })
  nombre: string;

  @Column({ type: "bigint", name: "IdCliente", nullable: false })
  idCliente: number;

  @CreateDateColumn({ type: "datetime", name: "FHRegistro", default: () => "CURRENT_TIMESTAMP" })
  fhRegistro: Date;

  @Column("tinyint", { name: "Estatus", default: () => "'1'" })
  estatus: number;

  @ManyToOne(() => Clientes, (cliente) => cliente.departamentos, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "IdCliente", referencedColumnName: "id" })
  cliente: Clientes;

  @OneToMany(() => InstalacionEquipo, (instalacionEquipo) => instalacionEquipo.departamento)
  instalacionesEquipo: InstalacionEquipo[];
}

