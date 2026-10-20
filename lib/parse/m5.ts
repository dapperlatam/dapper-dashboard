import type { M5Canal, M5Data, M5Dim, M5Kind, M5Period, M5PanelRow, M5Top } from "../types";
import { Cell, Rows, Section, findRow, findSection, isoDate, kv, num, sections, str, tableIn, val } from "./util";

const IND_TITLES = ["Panel ejecutivo", "Control del registro", "Totales del programa", "Por quincena", "Por semana", "Por mes", "Por persona", "Parámetros"];
const AN_TITLES = ["Parámetros y promedio", "1. Por formato", "2. Por eje", "3. Por enfoque", "4. Por elemento", "5. Por día", "6. Por franja", "7. Por red",
  "8. Por amplificación", "9. Mejor horario", "10. Por persona", "11. Top 5 publicaciones por vistas", "12. Top 5 publicaciones por tasa"];
const CA_TITLES = ["Resumen del último mes", "1. Blog", "2. Pauta", "3. PR", "4. Dapper orgánico: LinkedIn", "5. Dapper orgánico: Instagram", "6. Sitio web", "7. Sitio web: páginas"];

const KIND_BY_QUESTION: [string, M5Kind][] = [
  ["¿Cumple el equipo", "pct0"], ["¿Cumplen la regla", "pct0"], ["¿Crece la visibilidad", "int"], ["¿La gente reacciona", "pct1"],
  ["¿Genera negocio", "int"], ["¿Crece la red", "pct1"], ["¿Se mueve Dapper", "pct1"], ["¿Qué funciona", "text"],
];

function panelRows(sec: Section | undefined): M5PanelRow[] {
  return (sec?.rows ?? []).filter((r) => str(r[0]).startsWith("¿")).map((r) => {
    const full = str(r[0]);
    const q = full.indexOf("?");
    const pregunta = q >= 0 ? full.slice(0, q + 1) : full;
    const dato = q >= 0 ? full.slice(q + 1).trim() : "";
    const kind = KIND_BY_QUESTION.find(([k]) => pregunta.startsWith(k))?.[1] ?? "int";
    return { pregunta, dato, kind, valor: val(r[1]), ref: num(r[2]), cambio: num(r[3]), meta: val(r[4]), lectura: str(r[5]) };
  });
}

const period = (h: string[], r: Cell[]): M5Period => {
  const g = (name: string) => {
    const i = h.findIndex((x) => x.toLowerCase().startsWith(name.toLowerCase()));
    return i >= 0 ? r[i] : undefined;
  };
  return {
    inicio: isoDate(r[0]), fin: isoDate(g("Fin")), pubs: num(g("Publicaciones")), personas: num(g("Personas que publicaron")),
    cumplimiento: num(g("Cumplimiento")), vistas: num(g("Vistas")), alcance: num(g("Alcance")), reacciones: num(g("Reacciones")),
    comentarios: num(g("Comentarios")), compartidos: num(g("Compartidos")), guardados: num(g("Guardados")), interacciones: num(g("Interacciones")),
    visitasPerfil: num(g("Visitas al perfil")), seguidores: num(g("Seguidores ganados")), mensajes: num(g("Mensajes o contactos")),
    tasa: num(g("Tasa de interacción")),
  };
};

function periods(sec: Section | undefined, key: string): M5Period[] {
  const t = tableIn(sec, key);
  return t.rows.filter((r) => isoDate(r[0]) !== null).map((r) => period(t.headers, r));
}

function dims(S: Section[]): M5Dim[] {
  const prefixes = ["1. Por formato", "2. Por eje", "3. Por enfoque", "4. Por elemento", "5. Por día", "6. Por franja", "7. Por red", "8. Por amplificación"];
  return prefixes.map((p) => {
    const sec = findSection(S, p);
    const rows = (sec?.rows ?? []).slice(1);
    const items = rows.filter((r) => str(r[0]) !== "" && num(r[1]) !== null && !str(r[0]).startsWith("Mejor") && !str(r[0]).startsWith("Más vistas"))
      .map((r) => ({ name: str(r[0]), pubs: num(r[1]), vistasPorPub: num(r[2]), vsVistas: num(r[3]), tasa: num(r[4]), vsTasa: num(r[5]), mensajes: num(r[6]), suficiente: str(r[7]) }));
    return {
      titulo: (sec?.title ?? p).replace(/^\d+\.\s*/, ""),
      items,
      mejorTasa: str(findRow(sec, "Mejor tasa")?.[1]),
      masVistas: str(findRow(sec, "Más vistas")?.[1]),
    };
  });
}

function tops(sec: Section | undefined): M5Top[] {
  return (sec?.rows ?? []).filter((r) => num(r[0]) !== null && str(r[1]) !== "").map((r) => ({
    n: num(r[0]) ?? 0, responsable: str(r[1]), tema: str(r[2]), formato: str(r[3]), eje: str(r[4]), franja: str(r[5]), vistas: num(r[6]), tasa: num(r[7]), enlace: str(r[8]),
  }));
}

const CANAL_KEYS: Record<string, string> = {
  "1. Blog": "blog", "2. Pauta": "pauta", "3. PR": "pr", "4. Dapper orgánico: LinkedIn": "linkedin",
  "5. Dapper orgánico: Instagram": "instagram", "6. Sitio web": "sitio",
};

function canal(S: Section[], prefix: string): M5Canal {
  const sec = findSection(S, prefix);
  const t = tableIn(sec, "Mes");
  const row = (r: Cell[]) => Object.fromEntries(t.headers.map((h, i) => [h, val(r[i])]).filter(([h]) => h)) as Record<string, number | string | null>;
  return {
    key: CANAL_KEYS[prefix],
    titulo: (sec?.title ?? prefix).replace(/^\d+\.\s*/, ""),
    headers: t.headers.slice(1).filter(Boolean),
    meses: t.rows.filter((r) => isoDate(r[0]) !== null).map((r) => ({ mes: isoDate(r[0]), v: row(r) })),
    antes: (() => {
      const r = t.rows.find((x) => str(x[0]).toLowerCase().startsWith("promedio antes"));
      return r ? row(r) : null;
    })(),
  };
}

export function parseM5(indRows: Rows, anRows: Rows, caRows: Rows): M5Data {
  const SI = sections(indRows, IND_TITLES);
  const ctl = findSection(SI, "Control del registro");
  const par = findSection(SI, "Parámetros");
  const tot = tableIn(findSection(SI, "Totales del programa"), "Totales");
  const totRow = tot.rows.find((r) => str(r[0]).toLowerCase().startsWith("desde el inicio"));
  const pers = tableIn(findSection(SI, "Por persona"), "Persona");

  const SA = sections(anRows, AN_TITLES);
  const prm = findSection(SA, "Parámetros y promedio");
  const horario = findSection(SA, "9. Mejor horario");
  const hh = (horario?.rows ?? []).findIndex((r) => str(r[0]) === "Persona" && str(r[8]).toLowerCase().startsWith("mejor franja"));
  const red = tableIn(findSection(SA, "10. Por persona"), "Persona");

  const SC = sections(caRows, CA_TITLES);
  const res = tableIn(findSection(SC, "Resumen del último mes"), "Canal");

  return {
    panel: panelRows(findSection(SI, "Panel ejecutivo")),
    control: {
      pubs: num(kv(ctl, "Publicaciones hechas")), conMetricas: num(kv(ctl, "Publicaciones con métricas")),
      pendientesEquipo: num(kv(ctl, "Métricas pendientes de subir")), pendientesMarketing: num(kv(ctl, "Métricas pendientes de registrar")),
      vencidas: num(kv(ctl, "Publicaciones vencidas")), aTiempo: val(kv(ctl, "Publicadas a tiempo")),
    },
    totales: totRow ? period(tot.headers, totRow) : null,
    quincenas: periods(findSection(SI, "Por quincena"), "Quincena (inicio)"),
    semanas: periods(findSection(SI, "Por semana"), "Semana (lunes)"),
    meses: periods(findSection(SI, "Por mes"), "Mes"),
    personas: pers.rows.filter((r) => str(r[0]) !== "" && num(r[1]) !== null).map((r) => ({
      name: str(r[0]), pubs: num(r[1]), semanasConPub: num(r[2]), cumplimiento: num(r[3]), etiquetan: num(r[4]), vistas: num(r[5]),
      vistasPorPub: num(r[6]), tasa: num(r[7]), seguidores: num(r[8]), mensajes: num(r[9]),
    })),
    params: {
      inicio: isoDate(kv(par, "Inicio del programa")), metaCumplimiento: num(kv(par, "Meta de cumplimiento")), participantes: num(kv(par, "Participantes")),
      ultimaSemanaCerrada: isoDate(kv(par, "Última semana cerrada")), quincenasCerradas: num(kv(par, "Quincenas cerradas")),
      semanasCerradas: num(kv(par, "Semanas del programa")),
    },
    analisis: {
      minimo: num(kv(prm, "Mínimo de publicaciones")), tasaPrograma: num(kv(prm, "Tasa de interacción del programa")),
      vistasPrograma: num(kv(prm, "Vistas por publicación del programa")),
      dims: dims(SA),
      mejorFranja: hh < 0 ? [] : (horario?.rows ?? []).slice(hh + 1).filter((r) => str(r[0]) !== "" && str(r[8]) !== "").map((r) => ({ persona: str(r[0]), franja: str(r[8]) })),
      red: red.rows.filter((r) => str(r[0]) !== "" && (num(r[6]) !== null)).map((r) => ({
        persona: str(r[0]), seg0: num(r[1]), seg1: num(r[2]), seg2: num(r[3]), seg3: num(r[4]), crecimiento: num(r[5]), pubs: num(r[6]), vistasPorPub: num(r[7]),
        vistasPor100: num(r[8]), tasa: num(r[9]), vsTasa: num(r[10]), seguidoresGanados: num(r[11]), mensajes: num(r[12]), mejorFranja: str(r[13]),
      })),
      topVistas: tops(findSection(SA, "11. Top 5")),
      topTasa: tops(findSection(SA, "12. Top 5")),
    },
    canales: {
      resumen: res.rows.filter((r) => str(r[0]) !== "" && !str(r[0]).startsWith("Resumen")).slice(0, 8).map((r) => ({
        canal: str(r[0]), mes: isoDate(r[1]), mesTexto: isoDate(r[1]) ? "" : str(r[1]), hechoLabel: str(r[2]), hechoValor: num(r[3]), logroLabel: str(r[4]),
        logroValor: num(r[5]), cambio: num(r[6]), vsAntes: num(r[7]),
      })),
      detalle: Object.keys(CANAL_KEYS).filter((k) => k !== "3. PR").map((k) => canal(SC, k)),
    },
  };
}
