import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Clientes } from "./Clientes";
import { Equipos } from "./Equipos";
// Asegúrate de tener esta entidad

@Entity({ name: "InstalacionEquipo" })
export class InstalacionEquipo {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column({ type: "bigint", name: "IdEquipo" })
  idEquipo: string;

  @ManyToOne(() => Equipos, (equipo) => equipo.instalacionesEquipo) // Relación con Equipo
  @JoinColumn({ name: "IdEquipo", referencedColumnName: "id" })
  equipo: Equipos;

  @Column({ type: "double", name: "Lat" })
  lat: number;

  @Column({ type: "double", name: "Lng" })
  lng: number;

  @CreateDateColumn({ type: "datetime", name: "FHRegistro", default: () => "CURRENT_TIMESTAMP" })
  fhRegistro: Date;

  @UpdateDateColumn({ type: "datetime", name: "FechaActualizacion", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  fechaActualizacion: Date;

  @Column({ type: "bigint", name: "IdCliente", nullable: true })
  idCliente: string;

  @ManyToOne(() => Clientes, (cliente) => cliente.instalacionesEquipo, { nullable: true })
  @JoinColumn({ name: "IdCliente", referencedColumnName: "id" })
  cliente: Clientes;
}
