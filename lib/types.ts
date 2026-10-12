export type Num = number | null;
export type Triple = [Num, Num, Num];
export type Pair = [Num, Num];

export type M1Data = {
  meta: Num; arrActual: Num; pctAvance: Num; brecha: Num; fechaCorte: string | null;
  diasRestantes: Num; semanasRestantes: Num; arrPorSemana: Num;
  composicion: { label: string; arr: Num; pct: Num }[];
  contratoMayorPct: Num; top3Pct: Num; arrVence: Num; arrVencePct: Num;
  pipeline: { deals: Num; arr: Num; cobertura: Num; alertas: Num; fechasRevisar: Num };
  contratosActivos: number;
  grandes: { deal: string; arr: Num; pae: string; cuantos: Num; redondeado: Num }[];
  escenarios: { nombre: string; renov: Num; arrActual: Num; ajuste: Num; arrDeals: Num; arrProyectado: Num; brecha: Num }[];
  deals: { cliente: string; origen: string; rep: string; arr: Num; pae: string; legal: string; fechaCierre: string | null;
           ultimoUpdate: string | null; comentario: string; alerta: string }[];
};

export type M2Cmp = {
  firmados: Pair; pctPrimero: Num; arrTotal: Pair; arrProm: Pair; ratio: Num; difPct: Num;
  perdidos: Pair; tasaCierre: Pair; tasaRatio: Num; negociacion: Pair; sinDato: Num;
};
export type M2Data = {
  pae: M2Cmp; founder: M2Cmp;
  ops: { asignados: Num; diasPlan: Num; diasEntregable: Num; diasPlanEntregable: Num; proyectos: Num; proyectosMes: Num;
         califPromedio: Num; califUltima: Num; necesitanCalif: Num };
  filas: { pae: string; empresa: string; etapa: string; diasPlan: Num; diasEntregable: Num; proyectos: Num;
           proyectosMes: Num; califPromedio: Num; califUltima: Num; alerta: string; diasContrato: Num }[];
};

export type M3Pair = { pae: Num; cto: Num };
export type M3Data = {
  meta: M3Pair; vinculados: M3Pair; enVinculacion: M3Pair; avance: M3Pair; candidatos: M3Pair;
  estados: { label: string; pae: Num; cto: Num }[];
  validacion: { label: string; pae: Num; cto: Num }[];
  operacion: { reunionesProx7: M3Pair; sinDecision: M3Pair; sinCalificacion: M3Pair; conAlerta: M3Pair };
  tiempos: { entradaAInicio: M3Pair; activos: M3Pair };
  embudoPae: { etapa: string; registradas: Num; avanzan: Num; noAvanzan: Num; declinan: Num; pendientes: Num }[];
  embudoCto: { etapa: string; registradas: Num; avanzan: Num; noAvanzan: Num; declinan: Num; pendientes: Num }[];
  fuentes: { fuente: string; paeCand: Num; paeVinc: Num; ctoCand: Num; ctoVinc: Num }[];
  pendientesPorPersona: { persona: string; pae: Num; cto: Num }[];
  paeAsignados: { vinculados: Num; conEmpresa: Num; sinEmpresa: Num };
};

export type M4Data = {
  deckDR: {
    tareas: Triple; hechas: Triple; base: Triple; avanceTareas: Triple; avanceTotal: Triple;
    enCurso: Triple; enRevision: Triple; bloqueadas: Triple; porHacer: Triple; vencidas: Triple; vencenPronto: Triple;
    proxima: [string | null, string | null, string | null];
  };
  carga: { persona: string; pendientes: Num; vencidas: Num; manualesPorEntregar: Num; manualesSinImplementar: Num }[];
  cargaTotal: { pendientes: Num; vencidas: Num; manualesPorEntregar: Num; manualesSinImplementar: Num };
  mayorCarga: { persona: string; n: Num };
  manuales: {
    plan: Num; entregados: Num; enVigor: Num; sinImplementar: Num; enRevision: Num; enElaboracion: Num; porHacer: Num;
    pctEntregado: Num; pctEnVigor: Num; vencidos: Num; diasElaboracion: Num; diasVsReferencia: Num; diasEntregaVigor: Num; pctLinear: Num;
  };
  porArea: { area: string; total: Num; hechos: Num; porEntregar: Num; pct: Num }[];
};

export type M5Row = { name: string; pubs: Num; vistas: Num; reacciones: Num; comentarios: Num; compartidos: Num; interacciones: Num };
export type M5Group = { totals: M5Row[]; averages: M5Row[]; leaderTotal: string[]; leaderAvg: string[] };
export type M5Data = {
  resumen: { pubs: Num; vistas: Num; reacciones: Num; comentarios: Num; compartidos: Num; interacciones: Num;
             vistasPorPub: Num; interaccionesPorPub: Num; aTiempo: Num; pendientes: Num; vencidas: Num };
  meses: (M5Row & { fecha: string | null })[];
  semanas: (M5Row & { fecha: string | null })[];
  formato: M5Group;
  persona: M5Group;
};

export type UpdateRow = { fecha: string; meta: number; quien: string; avance: string; sigue: string; enlace: string };
export type WeekCell = "ok" | "miss" | "open";
export type UpdatesSummary = {
  today: string;
  deadline: string;          // lunes en que cierra la semana abierta
  daysLeft: number;          // 0 = vence hoy
  startDeadline: string;
  started: boolean;
  current: { meta: number; owner: string; done: boolean; lastDate: string | null }[];
  weeks: string[];           // fechas límite (lunes) visibles, de la más antigua a la actual
  matrix: Record<number, Record<string, WeekCell>>;
  points: { owner: string; points: number }[];
  latest: Record<number, UpdateRow | null>;
  total: number;
};

export type Status = "ok" | "warn" | "bad" | "neutral";
export type DashboardData = {
  mode: "live" | "demo";
  fetchedAt: string;
  errors: string[];
  m1: M1Data | null; m2: M2Data | null; m3: M3Data | null; m4: M4Data | null; m5: M5Data | null;
  updates: UpdatesSummary | null;
};
