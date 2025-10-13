import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { applySchema } from "src/utils/schema";
import { Permisos } from "./Permisos";
import { Bitacora } from "./Bitacora";

@Index("UQ_Modulos_Nombre", ["nombre"], { unique: true })
@Entity("Modulos")
@applySchema
export class Modulos {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Id" })
  id: number;

  @Column("varchar", { name: "Nombre", unique: true, length: 100 })
  nombre: string;

  @Column("varchar", { name: "Descripcion", nullable: true, length: 255 })
  descripcion: string | null;

  @Column("datetime", {
    name: "FechaCreacion",
    default: () => "CURRENT_TIMESTAMP",
  })
  fechaCreacion: Date;

  @Column("datetime", {
    name: "FechaActualizacion",
    default: () => "CURRENT_TIMESTAMP",
  })
  fechaActualizacion: Date;

  @Column("tinyint", { name: "Estatus", nullable: true })
  estatus: number | null;

  @OneToMany(() => Bitacora, (bitacora) => bitacora.idModulo2)
  bitacoras: Bitacora[];
 

  @OneToMany(() => Permisos, (permisos) => permisos.idModulo2)
  permisos: Permisos[];
}
