import type { M4Data, Triple } from "../types";
import { Rows, Section, findRow, findSection, isoDate, kv, num, sections, str } from "./util";

const TITLES = ["Deck y Data Room", "Carga por persona", "Manuales de procesos", "Manuales por área"];

export function parseM4(rows: Rows): M4Data {
  const S = sections(rows, TITLES);
  const dd = findSection(S, "Deck y Data Room");
  const t = (l: string): Triple => [num(kv(dd, l, 1)), num(kv(dd, l, 2)), num(kv(dd, l, 3))];
  const px = (): [string | null, string | null, string | null] => {
    const r = findRow(dd, "Próxima fecha");
    return [isoDate(r?.[1]), isoDate(r?.[2]), isoDate(r?.[3])];
  };
  const cg = findSection(S, "Carga por persona");
  const cargaRows = (cg?.rows ?? []).slice(1).filter((r) => str(r[0]) !== "" && !str(r[0]).startsWith("Mayor carga"));
  const toCarga = (r: (string | number | boolean | null | undefined)[]) => ({
    persona: str(r[0]), pendientes: num(r[1]), vencidas: num(r[2]), manualesPorEntregar: num(r[3]), manualesSinImplementar: num(r[4]),
  });
  const totalRow = cargaRows.find((r) => str(r[0]) === "Total");
  const mayor = findRow(cg, "Mayor carga");
  const mn = findSection(S, "Manuales de procesos");
  const m = (l: string) => num(kv(mn, l));
  const area = findSection(S, "Manuales por área");
  return {
    deckDR: {
      tareas: t("Tareas cargadas"), hechas: t("Tareas hechas"), base: t("Avance base"), avanceTareas: t("Avance de las tareas"),
      avanceTotal: t("Avance total"), enCurso: t("En curso"), enRevision: t("En revisión"), bloqueadas: t("Bloqueadas"),
      porHacer: t("Por hacer"), vencidas: t("Vencidas"), vencenPronto: t("Vencen en los próximos"), proxima: px(),
    },
    carga: cargaRows.filter((r) => str(r[0]) !== "Total").map(toCarga),
    cargaTotal: totalRow
      ? (({ pendientes, vencidas, manualesPorEntregar, manualesSinImplementar }) => ({ pendientes, vencidas, manualesPorEntregar, manualesSinImplementar }))(toCarga(totalRow))
      : { pendientes: null, vencidas: null, manualesPorEntregar: null, manualesSinImplementar: null },
    mayorCarga: { persona: str(mayor?.[1]), n: num(mayor?.[2]) },
    manuales: {
      plan: m("Manuales en el plan"), entregados: m("Entregados o en vigor"), enVigor: m("En vigor"), sinImplementar: m("Entregados sin implementar"),
      enRevision: m("En revisión"), enElaboracion: m("En elaboración"), porHacer: m("Por hacer"), pctEntregado: m("% entregado"),
      pctEnVigor: m("% en vigor"), vencidos: m("Vencidos"), diasElaboracion: m("Días promedio de elaboración"),
      diasVsReferencia: m("Días promedio frente"), diasEntregaVigor: m("Días promedio de entrega"), pctLinear: m("% de manuales con código"),
    },
    porArea: ((area as Section | undefined)?.rows ?? []).slice(1).filter((r) => str(r[0]) !== "" && num(r[1]) !== null)
      .map((r) => ({ area: str(r[0]), total: num(r[1]), hechos: num(r[2]), porEntregar: num(r[3]), pct: num(r[4]) })),
  };
}
