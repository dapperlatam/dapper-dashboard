import type { M5Data, M5Group, M5Row } from "../types";
import { Rows, Section, findSection, isoDate, kv, num, sections, str } from "./util";

const TITLES = ["Parámetros de las tablas", "Resumen general", "Por mes", "Por semana", "Por formato: totales",
  "Por formato: promedio", "Por persona: totales", "Por persona: promedio"];

const toRow = (r: (string | number | boolean | null | undefined)[]): M5Row => ({
  name: str(r[0]), pubs: num(r[1]), vistas: num(r[2]), reacciones: num(r[3]), comentarios: num(r[4]), compartidos: num(r[5]), interacciones: num(r[6]),
});
const isLeader = (r: (string | number | boolean | null | undefined)[]) => str(r[0]).toLowerCase().includes("líder");

function group(totals: Section | undefined, avgs: Section | undefined): M5Group {
  const rows = (s: Section | undefined) => (s?.rows ?? []).slice(1).filter((r) => str(r[0]) !== "");
  const leader = (s: Section | undefined) => {
    const r = rows(s).find(isLeader);
    return [2, 3, 4, 5, 6].map((c) => str(r?.[c]));
  };
  return {
    totals: rows(totals).filter((r) => !isLeader(r) && num(r[1]) !== null).map(toRow),
    averages: rows(avgs).filter((r) => !isLeader(r) && num(r[1]) !== null).map(toRow),
    leaderTotal: leader(totals),
    leaderAvg: leader(avgs),
  };
}

export function parseM5(rows: Rows): M5Data {
  const S = sections(rows, TITLES);
  const res = findSection(S, "Resumen general");
  const r = (l: string) => num(kv(res, l));
  const series = (s: Section | undefined) =>
    (s?.rows ?? []).slice(1).filter((x) => num(x[0]) !== null && num(x[1]) !== null)
      .map((x) => ({ ...toRow(x), name: isoDate(x[0]) ?? "", fecha: isoDate(x[0]) }));
  return {
    resumen: {
      pubs: r("Publicaciones hechas"), vistas: r("Vistas totales"), reacciones: r("Reacciones totales"), comentarios: r("Comentarios totales"),
      compartidos: r("Compartidos totales"), interacciones: r("Interacciones totales"), vistasPorPub: r("Vistas por publicación"),
      interaccionesPorPub: r("Interacciones por publicación"), aTiempo: r("Publicadas a tiempo"), pendientes: r("Tareas pendientes"),
      vencidas: r("Tareas vencidas"),
    },
    meses: series(findSection(S, "Por mes")),
    semanas: series(findSection(S, "Por semana")),
    formato: group(findSection(S, "Por formato: totales"), findSection(S, "Por formato: promedio")),
    persona: group(findSection(S, "Por persona: totales"), findSection(S, "Por persona: promedio")),
  };
}
