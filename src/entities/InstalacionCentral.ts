import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Clientes } from "./Clientes";
import { InstalacionEquipo } from "./InstalacionEquipo";

@Entity({ name: "InstalacionCentral" })
export class InstalacionCentral {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ type: "bigint", name: "IdCliente" })
  idCliente: number;

    @Column({ type: "double", name: "Lat" })
  lat: number;

  @Column({ type: "double", name: "Lng" })
  lng: number;
    @Column("tinyint", { name: "Estatus", default: () => "'1'" })
  estatus: number;

  @ManyToOne(() => Clientes, (cliente) => cliente.instalaciones, {
    onDelete: "RESTRICT",  
  })
  @JoinColumn({ name: "IdCliente", referencedColumnName: "id" })
  cliente: Clientes;



    @OneToMany(() => InstalacionEquipo, (instalacionEquipo) => instalacionEquipo.instalacionCentral)
  instalaciones: InstalacionEquipo[];
}
