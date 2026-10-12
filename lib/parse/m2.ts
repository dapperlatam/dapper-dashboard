import type { M2Cmp, M2Data } from "../types";
import { Rows, Section, findSection, kv, num, sections, str, tableByHeader } from "./util";

const TITLES = ["Parámetros", "Comercial, PAE", "Comercial, Founder Led Sales", "Operación, PAE"];

function cmp(sec: Section | undefined): M2Cmp {
  const g = (l: string, c: number) => num(kv(sec, l, c));
  return {
    firmados: [g("Contratos firmados, activos", 1), g("Contratos firmados, activos", 2)],
    pctPrimero: g("% de contratos firmados", 1),
    arrTotal: [g("ARR total", 1), g("ARR total", 2)],
    arrProm: [g("ARR promedio", 1), g("ARR promedio", 2)],
    ratio: g("ARR promedio", 3),
    difPct: g("Diferencia", 1),
    perdidos: [g("Deals perdidos", 1), g("Deals perdidos", 2)],
    tasaCierre: [g("Tasa de cierre", 1), g("Tasa de cierre", 2)],
    tasaRatio: g("Tasa de cierre", 3),
    negociacion: [g("Deals en negociación", 1), g("Deals en negociación", 2)],
    sinDato: g("Contratos firmados sin dato", 1),
  };
}

export function parseM2(calc: Rows, paeRows: Rows): M2Data {
  const S = sections(calc, TITLES);
  const ops = findSection(S, "Operación");
  const o = (l: string) => num(kv(ops, l));
  const filas = tableByHeader(paeRows, "PAE")
    .filter((r) => str(r["Empresa asignada"]) !== "")
    .map((r) => ({
      pae: str(r["PAE"]),
      empresa: str(r["Empresa asignada"]),
      etapa: str(r["Etapa"]),
      diasPlan: num(r["Días: inicio del contrato a primer plan"]),
      diasEntregable: num(r["Días: inicio del contrato a primer entregable"]),
      proyectos: num(r["# proyectos entregados (acumulado)"]),
      proyectosMes: num(r["Proyectos entregados por mes"]),
      califPromedio: num(r["Calificación promedio"]),
      califUltima: num(r["Última calificación (1 a 5)"]),
      alerta: str(r["Alerta de calificación"]),
      diasContrato: num(r["Días de contrato hasta hoy"]),
    }));
  return {
    pae: cmp(findSection(S, "Comercial, PAE")),
    founder: cmp(findSection(S, "Comercial, Founder")),
    ops: {
      asignados: o("PAE con empresa asignada"),
      diasPlan: o("Promedio de días: inicio del contrato a primer plan"),
      diasEntregable: o("Promedio de días: inicio del contrato a primer entregable"),
      diasPlanEntregable: o("Promedio de días: plan de trabajo"),
      proyectos: o("Proyectos entregados (total)"),
      proyectosMes: o("Proyectos entregados por mes"),
      califPromedio: o("Calificación promedio de satisfacción"),
      califUltima: o("Calificación promedio usando"),
      necesitanCalif: o("Asignaciones que necesitan"),
    },
    filas,
  };
}
