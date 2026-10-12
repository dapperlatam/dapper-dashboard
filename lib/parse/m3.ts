import type { M3Data, M3Pair } from "../types";
import { Rows, Section, findSection, kv, num, sections, str, tableRows } from "./util";

const TITLES = [
  "Meta de contrataciones", "Candidatos por estado", "Validación de requisitos", "Operación pendiente", "Tiempos",
  "Embudo por etapa: PAE", "Embudo por etapa: CTO", "Fuentes de candidatos", "Evaluaciones pendientes por entrevistador",
  "PAE vinculados y empresa asignada",
];

export function parseM3(rows: Rows): M3Data {
  const S = sections(rows, TITLES);
  const pair = (sec: Section | undefined, label: string): M3Pair => ({ pae: num(kv(sec, label, 1)), cto: num(kv(sec, label, 2)) });
  const meta = findSection(S, "Meta de contrataciones");
  const ope = findSection(S, "Operación pendiente");
  const tie = findSection(S, "Tiempos");
  const lista = (sec: Section | undefined) =>
    tableRows(sec).map((r) => ({ label: str(r[0]), pae: num(r[1]), cto: num(r[2]) }));
  const embudo = (sec: Section | undefined) =>
    tableRows(sec).map((r) => ({
      etapa: str(r[0]), registradas: num(r[1]), avanzan: num(r[2]), noAvanzan: num(r[3]), declinan: num(r[4]), pendientes: num(r[5]),
    }));
  const pae = findSection(S, "PAE vinculados");
  return {
    meta: pair(meta, "Meta de contrataciones"),
    vinculados: pair(meta, "Vinculados"),
    enVinculacion: pair(meta, "En vinculación"),
    avance: pair(meta, "Avance hacia la meta"),
    candidatos: pair(meta, "Candidatos totales"),
    estados: lista(findSection(S, "Candidatos por estado")),
    validacion: lista(findSection(S, "Validación")),
    operacion: {
      reunionesProx7: pair(ope, "Reuniones agendadas"),
      sinDecision: pair(ope, "Reuniones realizadas sin decisión"),
      sinCalificacion: pair(ope, "Reuniones con decisión"),
      conAlerta: pair(ope, "Candidatos con alerta"),
    },
    tiempos: { entradaAInicio: pair(tie, "Promedio desde la entrada"), activos: pair(tie, "Promedio en el proceso") },
    embudoPae: embudo(findSection(S, "Embudo por etapa: PAE")),
    embudoCto: embudo(findSection(S, "Embudo por etapa: CTO")),
    fuentes: tableRows(findSection(S, "Fuentes")).map((r) => ({
      fuente: str(r[0]), paeCand: num(r[1]), paeVinc: num(r[2]), ctoCand: num(r[3]), ctoVinc: num(r[4]),
    })),
    pendientesPorPersona: lista(findSection(S, "Evaluaciones pendientes")).map((x) => ({ persona: x.label, pae: x.pae, cto: x.cto })),
    paeAsignados: {
      vinculados: num(kv(pae, "PAE vinculados")),
      conEmpresa: num(kv(pae, "Con empresa asignada")),
      sinEmpresa: num(kv(pae, "Sin empresa asignada")),
    },
  };
}
