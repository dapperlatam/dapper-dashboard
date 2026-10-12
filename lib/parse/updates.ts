import type { UpdateRow } from "../types";
import { Rows, isoDate, str, tableByHeader } from "./util";

/** Lee la pestaña "Updates de metas": una fila por update, con fecha, meta y texto. */
export function parseUpdates(rows: Rows): UpdateRow[] {
  return tableByHeader(rows, "Fecha")
    .map((r) => {
      const meta = Number((str(r["Meta"]).match(/\d/) ?? [])[0]);
      return {
        fecha: isoDate(r["Fecha"]) ?? "",
        meta,
        quien: str(r["Quién reporta"] ?? r["Quién reporta (encargado de la meta)"]),
        avance: str(r["Qué avanzó esta semana"]),
        sigue: str(r["Qué sigue o qué lo bloquea"]),
        enlace: str(r["Enlace (opcional)"]),
      };
    })
    .filter((u) => u.fecha !== "" && u.meta >= 1 && u.meta <= 5);
}
