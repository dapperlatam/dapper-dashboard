import type { M1Data, M1Desempeno } from "../types";
import { Rows, findSection, isoDate, kv, num, sections, str, tableByHeader, tableIn, findRow } from "./util";

const TITLES = ["Parámetros", "Avance hacia la meta", "Composición y concentración", "Pipeline en negociación", "Grandes deals", "Escenarios"];

const DES_TITLES = ["Parámetros", "Calendario de semanas", "Resumen por comercial y mes", "1. First approach", "2. Seguimiento semanal"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const isWeekHeader = (h: string) => /S\d+\s*·/.test(h);

/** Lee la pestaña "M1 Desempeño": first approach por comercial y seguimiento semanal a los deals en negociación. */
function parseDesempeno(rows: Rows): M1Desempeno | null {
  if (!rows.length) return null;
  const S = sections(rows, DES_TITLES);
  const par = findSection(S, "Parámetros");
  const mesEnCurso = str(kv(par, "Mes en curso")).toLowerCase();
  const metas = tableIn(par, "Mes").rows.filter((r) => MESES.includes(str(r[0]).toLowerCase()));
  const metaFA = num(metas.find((r) => str(r[0]).toLowerCase() === mesEnCurso)?.[1]);

  const res = tableIn(findSection(S, "Resumen por comercial"), "Mes");
  const resumen = res.rows.filter((r) => MESES.includes(str(r[0]).toLowerCase()) && str(r[1]) !== "").map((r) => ({
    mes: str(r[0]).toLowerCase(), comercial: str(r[1]), fa: num(r[3]), meta: num(r[4]), pctMeta: num(r[5]),
    fuHechos: num(r[6]), fuPosibles: num(r[7]), pctSeg: num(r[8]), indice: num(r[9]),
  }));

  const fa = tableIn(findSection(S, "1. First approach"), "Comercial");
  const totalRow = fa.rows.find((r) => str(r[0]).toLowerCase().startsWith("total equipo"));
  const semanas = fa.headers.map((h, i) => ({ h, i })).filter((x) => isWeekHeader(x.h)).map((x) => {
    const parts = x.h.split("\n");
    return { mes: parts.length > 1 ? parts[0].trim().toLowerCase() : "", label: parts[parts.length - 1].trim(), total: num(totalRow?.[x.i]) };
  });

  const seg = tableIn(findSection(S, "2. Seguimiento semanal"), "Cliente (elige de la lista de M1 ARR)");
  const weekCols = seg.headers.map((h, i) => ({ h, i })).filter((x) => isWeekHeader(x.h));
  const monthCol = seg.headers.findIndex((h) => h.trim().toLowerCase() === mesEnCurso);
  const deals = seg.rows.filter((r) => str(r[0]) !== "").map((r) => ({
    cliente: str(r[0]), comercial: str(r[1]), estado: str(r[2]),
    flags: weekCols.filter((w) => w.h.split("\n")[0].trim().toLowerCase() === mesEnCurso).map((w) => ({ label: w.h.split("\n").pop()!.trim(), v: num(r[w.i]) })),
    pctMes: monthCol >= 0 ? num(r[monthCol]) : null,
  }));
  return { mesEnCurso, metaFA, pesoFA: num(kv(par, "Peso del first approach")), pesoSeg: num(kv(par, "Peso del seguimiento")), resumen, semanas, deals };
}

export function parseM1(calc: Rows, arr: Rows, desempeno: Rows = []): M1Data {
  const S = sections(calc, TITLES);
  const par = findSection(S, "Parámetros");
  const av = findSection(S, "Avance hacia");
  const comp = findSection(S, "Composición");
  const pip = findSection(S, "Pipeline");
  const gd = findSection(S, "Grandes deals");
  const esc = findSection(S, "Escenarios");

  const compRow = (label: string, name: string) => {
    const r = findRow(comp, label);
    return { label: name, arr: num(r?.[1]), pct: num(r?.[2]) };
  };

  const grandes = (gd?.rows ?? []).slice(1)
    .filter((r) => str(r[0]) !== "" && num(r[1]) !== null)
    .map((r) => ({ deal: str(r[0]), arr: num(r[1]), pae: str(r[2]), cuantos: num(r[3]), redondeado: num(r[4]) }));

  const escRows = (label: string) => findRow(esc, label) ?? [];
  const names = escRows("Nombre del escenario");
  const escenarios = [2, 3, 4, 5].map((c) => ({
    nombre: str(names[c]),
    renov: num(escRows("% del ARR")[c]),
    arrActual: num(escRows("ARR actual")[c]),
    ajuste: num(escRows("Ajuste por ARR")[c]),
    arrDeals: num(escRows("ARR de los deals")[c]),
    arrProyectado: num(escRows("ARR proyectado")[c]),
    brecha: num(escRows("Brecha restante")[c]),
  })).filter((e) => e.nombre !== "" && ((e.arrDeals ?? 0) > 0 || (e.ajuste ?? 0) !== 0));

  const table = tableByHeader(arr, "Founder Lead Sales");
  const deals = table
    .filter((r) => str(r["Estado (automático)"]) === "En negociación" && str(r["Client"]) !== "")
    .map((r) => ({
      cliente: str(r["Client"]),
      origen: str(r["Founder Lead Sales"]),
      rep: str(r["Sales Rep"]),
      arr: num(r["ARR anualizado (USD)"]),
      pae: str(r["Tiene PAE"]),
      legal: str(r["Estado legal (Ingrid)"]),
      fechaCierre: isoDate(r["Fecha estimada de cierre"]),
      ultimoUpdate: isoDate(r["Fecha del último seguimiento"] ?? r["Fecha del último update"]),
      comentario: str(r["Seguimiento del mes en curso"] ?? r["Último update y próximo paso"]),
      alerta: str(r["Alerta"]),
    }))
    .sort((a, b) => (b.arr ?? 0) - (a.arr ?? 0));
  const contratosActivos = table.filter((r) => str(r["Estado (automático)"]) === "Activo").length;

  return {
    meta: num(kv(par, "Meta de ARR")),
    arrActual: num(kv(av, "ARR actual")),
    pctAvance: num(kv(av, "% de avance")),
    brecha: num(kv(av, "Brecha por cerrar")),
    fechaCorte: isoDate(kv(par, "Fecha de corte")),
    diasRestantes: num(kv(av, "Días restantes")),
    semanasRestantes: num(kv(av, "Semanas restantes")),
    arrPorSemana: num(kv(av, "ARR nuevo requerido")),
    composicion: [
      compRow("ARR Founder Led Sales", "Founder Led Sales"),
      compRow("ARR Organic Sale", "Orgánico"),
      compRow("ARR con PAE sin dato", "PAE sin dato"),
      compRow("ARR con PAE", "Con PAE"),
      compRow("ARR sin PAE", "Sin PAE"),
    ],
    contratoMayorPct: num(kv(comp, "Contrato más grande")),
    top3Pct: num(kv(comp, "Tres contratos")),
    arrVence: num(kv(comp, "ARR que vence")),
    arrVencePct: num(findRow(comp, "ARR que vence")?.[2]),
    pipeline: {
      deals: num(kv(pip, "Deals en negociación")),
      arr: num(kv(pip, "ARR en negociación")),
      cobertura: num(kv(pip, "Cobertura")),
      alertas: num(kv(pip, "Deals con alerta")),
      fechasRevisar: num(kv(pip, "Filas con fechas")),
    },
    contratosActivos,
    desempeno: parseDesempeno(desempeno),
    grandes,
    escenarios,
    deals,
  };
}
