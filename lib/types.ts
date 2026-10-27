export type Num = number | null;
export type Triple = [Num, Num, Num];
export type Pair = [Num, Num];

export type M1Desempeno = {
  mesEnCurso: string; metaFA: Num; pesoFA: Num; pesoSeg: Num;
  resumen: { mes: string; comercial: string; fa: Num; meta: Num; pctMeta: Num; fuHechos: Num; fuPosibles: Num; pctSeg: Num; indice: Num }[];
  semanas: { mes: string; label: string; total: Num }[];
  deals: { cliente: string; comercial: string; estado: string; flags: { label: string; v: number | null }[]; pctMes: Num }[];
};

export type M1Data = {
  meta: Num; arrActual: Num; pctAvance: Num; brecha: Num; fechaCorte: string | null;
  diasRestantes: Num; semanasRestantes: Num; arrPorSemana: Num;
  composicion: { label: string; arr: Num; pct: Num }[];
  contratoMayorPct: Num; top3Pct: Num; arrVence: Num; arrVencePct: Num;
  pipeline: { deals: Num; arr: Num; cobertura: Num; alertas: Num; fechasRevisar: Num };
  contratosActivos: number;
  desempeno: M1Desempeno | null;
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

export type M3Data = {
  meta: Num; candidatos: Num; enProceso: Num; descartados: Num; declinaron: Num; aceptaron: Num; avance: number | string | null;
  embudo: { paso: string; n: Num; etapa: string }[];
  validacion: { label: string; n: Num }[];
  pendientes: { label: string; n: Num }[];
  fuentes: { fuente: string; candidatos: Num; entrevistados: Num; aceptaron: Num }[];
  completar: { etapa: string; hechas: Num; sinCalificacion: Num; sinComentario: Num; sinDecision: Num }[];
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

export type M5Kind = "pct0" | "pct1" | "int" | "text";
export type M5PanelRow = {
  pregunta: string; dato: string; kind: M5Kind; valor: number | string | null; ref: Num; cambio: Num;
  meta: number | string | null; lectura: string;
};
export type M5Period = {
  inicio: string | null; fin: string | null; pubs: Num; personas: Num; cumplimiento: Num; vistas: Num; alcance: Num; reacciones: Num;
  comentarios: Num; compartidos: Num; guardados: Num; interacciones: Num; visitasPerfil: Num; seguidores: Num; mensajes: Num; tasa: Num;
};
export type M5Persona = {
  name: string; pubs: Num; semanasConPub: Num; cumplimiento: Num; etiquetan: Num; vistas: Num; vistasPorPub: Num; tasa: Num;
  seguidores: Num; mensajes: Num;
};
export type M5Dim = {
  titulo: string;
  items: { name: string; pubs: Num; vistasPorPub: Num; vsVistas: Num; tasa: Num; vsTasa: Num; mensajes: Num; suficiente: string }[];
  mejorTasa: string; masVistas: string;
};
export type M5Top = { n: number; responsable: string; tema: string; formato: string; eje: string; franja: string; vistas: Num; tasa: Num; enlace: string };
export type M5Canal = {
  key: string; titulo: string; headers: string[];
  meses: { mes: string | null; v: Record<string, number | string | null> }[];
  antes: Record<string, number | string | null> | null;
};
export type M5Data = {
  panel: M5PanelRow[];
  control: { pubs: Num; conMetricas: Num; pendientesEquipo: Num; pendientesMarketing: Num; vencidas: Num; aTiempo: number | string | null };
  totales: M5Period | null;
  quincenas: M5Period[];
  semanas: M5Period[];
  meses: M5Period[];
  personas: M5Persona[];
  params: { inicio: string | null; metaCumplimiento: Num; participantes: Num; ultimaSemanaCerrada: string | null; quincenasCerradas: Num; semanasCerradas: Num };
  analisis: {
    minimo: Num; tasaPrograma: Num; vistasPrograma: Num;
    dims: M5Dim[];
    mejorFranja: { persona: string; franja: string }[];
    red: { persona: string; seg0: Num; seg1: Num; seg2: Num; seg3: Num; crecimiento: Num; pubs: Num; vistasPorPub: Num; vistasPor100: Num; tasa: Num;
           vsTasa: Num; seguidoresGanados: Num; mensajes: Num; mejorFranja: string }[];
    topVistas: M5Top[];
    topTasa: M5Top[];
  };
  canales: {
    resumen: { canal: string; mes: string | null; mesTexto: string; hechoLabel: string; hechoValor: Num; logroLabel: string; logroValor: Num;
               cambio: Num; vsAntes: Num }[];
    detalle: M5Canal[];
  };
};

export type UpdateRow = { fecha: string; meta: number; quien: string; avance: string; sigue: string; enlace: string };
export type WeekCell = "ok" | "miss" | "open";
export type UpdatesSummary = {
  today: string;
  deadline: string;          // lunes en que cierra la semana abierta
  daysLeft: number;          // 0 = vence hoy
  startDeadline: string;
  started: boolean;
  current: { key: string; label: string; owner: string; done: boolean }[];
  weeks: string[];           // fechas límite (lunes) visibles, de la más antigua a la actual
  matrix: Record<string, Record<string, WeekCell>>;
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
