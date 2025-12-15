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
import { InstalacionCentral } from "./InstalacionCentral";
import { CatDepartamentos } from "./CatDepartamentos";
// Asegúrate de tener esta entidad

@Entity({ name: "InstalacionEquipo" })
export class InstalacionEquipo {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ type: "bigint", name: "IdEquipo" })
  idEquipo: number;

  @ManyToOne(() => Equipos, (equipo) => equipo.instalacionesEquipo) // Relación con Equipo
  @JoinColumn({ name: "IdEquipo", referencedColumnName: "id" })
  equipo: Equipos;

  @Column({ type: "double", name: "Lat" })
  lat: number;

  @Column({ type: "double", name: "Lng" })
  lng: number;
    @Column("tinyint", { name: "Estatus", default: () => "'1'" })
  estatus: number;

  @CreateDateColumn({ type: "datetime", name: "FHRegistro", default: () => "CURRENT_TIMESTAMP" })
  fhRegistro: Date;

  @UpdateDateColumn({ type: "datetime", name: "FechaActualizacion", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
  fechaActualizacion: Date;

  @Column({ type: "bigint", name: "IdCliente", nullable: true })
  idCliente: number;
  @Column({ type: "bigint", name: "IdSedeCentral", nullable: true })
  idSedeCentral: number;

  @Column({ type: "int", name: "NroPiso", nullable: true })
  nroPiso: number;

  @Column({ type: "bigint", name: "IdDepartamento", nullable: true })
  idDepartamento: number;

  @ManyToOne(() => Clientes, (cliente) => cliente.instalacionesEquipo, { nullable: true })
  @JoinColumn({ name: "IdCliente", referencedColumnName: "id" })
  cliente: Clientes;

    @ManyToOne(() => InstalacionCentral, (instalacionCentral) => instalacionCentral.instalaciones, { nullable: true })
  @JoinColumn({ name: "IdSedeCentral", referencedColumnName: "id" })
  instalacionCentral: InstalacionCentral;

  @ManyToOne(() => CatDepartamentos, (departamento) => departamento.instalacionesEquipo, { nullable: true })
  @JoinColumn({ name: "IdDepartamento", referencedColumnName: "id" })
  departamento: CatDepartamentos;
}
