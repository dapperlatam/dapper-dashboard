import type { M1Data } from "../types";
import { Rows, findSection, isoDate, kv, num, sections, str, tableByHeader, findRow } from "./util";

const TITLES = ["Parámetros", "Avance hacia la meta", "Composición y concentración", "Pipeline en negociación", "Grandes deals", "Escenarios"];

export function parseM1(calc: Rows, arr: Rows): M1Data {
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
      ultimoUpdate: isoDate(r["Fecha del último update"]),
      comentario: str(r["Último update y próximo paso"]),
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
    grandes,
    escenarios,
    deals,
  };
}
