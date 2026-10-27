import type { M3Data } from "../types";
import { Rows, findSection, kv, num, sections, str, tableIn, val } from "./util";

const TITLES = ["Resumen del proceso", "Embudo por paso", "Validación de requisitos", "Pendientes", "Fuentes de candidatos", "Datos por completar"];

/** Lee la pestaña "M3 Indicadores PAE": solo conteos del proceso del PAE, sin nombres ni salarios. */
export function parseM3(rows: Rows): M3Data {
  const S = sections(rows, TITLES);
  const res = findSection(S, "Resumen del proceso");
  const items = (title: string, key: string) =>
    tableIn(findSection(S, title), key).rows.filter((r) => str(r[0]) !== "" && num(r[1]) !== null);
  return {
    meta: num(kv(res, "Meta de contrataciones")),
    candidatos: num(kv(res, "Candidatos totales")),
    enProceso: num(kv(res, "En proceso")),
    descartados: num(kv(res, "Descartados")),
    declinaron: num(kv(res, "Declinaron")),
    aceptaron: num(kv(res, "Aceptaron")),
    avance: val(kv(res, "Avance hacia la meta")),
    embudo: items("Embudo por paso", "Paso").map((r) => ({ paso: str(r[0]), n: num(r[1]), etapa: str(r[2]) })),
    validacion: items("Validación de requisitos", "Clasificación").map((r) => ({ label: str(r[0]), n: num(r[1]) })),
    pendientes: items("Pendientes", "Tema").map((r) => ({ label: str(r[0]), n: num(r[1]) })),
    fuentes: items("Fuentes de candidatos", "Fuente").map((r) => ({ fuente: str(r[0]), candidatos: num(r[1]), entrevistados: num(r[2]), aceptaron: num(r[3]) })),
    completar: items("Datos por completar", "Etapa").map((r) => ({ etapa: str(r[0]), hechas: num(r[1]), sinCalificacion: num(r[2]), sinComentario: num(r[3]), sinDecision: num(r[4]) })),
  };
}
