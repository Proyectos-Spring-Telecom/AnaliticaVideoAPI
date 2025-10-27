import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Clientes } from "./Clientes";

@Entity({ name: "InstalacionCentral" })
export class InstalacionCentral {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;  // bigint en MySQL mapea a string en TS para evitar overflow

  @Column({ type: "bigint", name: "IdCliente" })
  idCliente: string;

  @ManyToOne(() => Clientes, (cliente) => cliente.instalaciones, {
    onDelete: "RESTRICT",  // o el comportamiento que necesites
  })
  @JoinColumn({ name: "IdCliente", referencedColumnName: "id" })
  cliente: Clientes;

  @Column({ type: "double", name: "Lat" })
  lat: number;

  @Column({ type: "double", name: "Lng" })
  lng: number;
}
