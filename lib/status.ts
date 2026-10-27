import type { DashboardData, Status } from "./types";
import { n0 } from "./format";

export type MetaInfo = { id: 1 | 2 | 3 | 4 | 5; short: string; title: string; owner: string; pointsOwner: string; rule: string };

// "owner" es quien aparece como encargado; "pointsOwner" es a quien se le suman los puntos si falta el update semanal.
export const METAS: MetaInfo[] = [
  { id: 1, short: "5M ARR", title: "Llegar a 5M de ARR", owner: "Gerardo Vilchis", pointsOwner: "Gerardo Vilchis",
    rule: "Compara el pipeline en negociación con la brecha de ARR. Verde: el pipeline cubre al menos 1 vez la brecha (o la meta ya se cumplió). Ámbar: cubre entre 0,5 y 1 vez. Rojo: cubre menos de 0,5 veces o no hay pipeline con ARR." },
  { id: 2, short: "PAE y Founder Led", title: "Validar la estrategia comercial: PAE y Founder Led Sales", owner: "Wendy Sánchez", pointsOwner: "Wendy Sánchez",
    rule: "Es una meta de medición, sin cifra objetivo. Ámbar si hay contratos sin dato de PAE o PAE sin calificación reciente; verde si los datos están completos." },
  { id: 3, short: "Contratación", title: "Validar los hirings: más PAE y CTO", owner: "Ingrid Payares", pointsOwner: "Ingrid Payares",
    rule: "Gris si aún no hay candidatos. Ámbar si hay entrevistas o pruebas hechas sin decisión, o campos del histórico por completar. Verde en otro caso." },
  { id: 4, short: "Deck, data room y manuales", title: "Terminar el deck, el data room y los manuales de procesos", owner: "Pablo Pastrana y Wendy Sánchez", pointsOwner: "Pablo Pastrana",
    rule: "Rojo si hay tareas del deck o data room vencidas, o manuales vencidos. Ámbar si hay tareas bloqueadas o manuales entregados sin implementar. Verde en otro caso. Gris si aún no hay plan cargado." },
  { id: 5, short: "Momentum", title: "Generar momentum para la ronda", owner: "Edinson Loaiza", pointsOwner: "Edinson Loaiza",
    rule: "Gris si la campaña aún no tiene publicaciones. Rojo si hay publicaciones vencidas sin publicar. Ámbar si hay métricas pendientes de subir o de registrar, o si el cumplimiento semanal está bajo la meta. Verde en otro caso." },
];

export type StatusInfo = { status: Status; label: string; detail: string };

/**
 * Reglas del semáforo (se calculan solas con los indicadores; no se registran en los Sheets; el texto visible está en METAS.rule):
 * - Meta 1: según cuánto cubre el pipeline la brecha de ARR (verde ≥ 1x, ámbar ≥ 0,5x, rojo menos).
 * - Meta 2: es de medición, no tiene meta numérica; ámbar si faltan datos de PAE o calificaciones.
 * - Meta 3: ámbar si hay reuniones sin decisión o candidatos con alerta.
 * - Meta 4: rojo si hay tareas o manuales vencidos; ámbar si hay bloqueos o manuales sin implementar.
 * - Meta 5: rojo si hay tareas vencidas; ámbar si hay tareas pendientes.
 */
export function statusFor(id: number, d: DashboardData): StatusInfo {
  const none: StatusInfo = { status: "neutral", label: "Sin datos", detail: "Aún no hay información cargada" };
  if (id === 1) {
    const m = d.m1;
    if (!m || m.arrActual === null) return none;
    if ((m.pctAvance ?? 0) >= 1) return { status: "ok", label: "Meta cumplida", detail: "ARR actual supera la meta" };
    const c = m.pipeline.cobertura;
    if (c === null || m.pipeline.arr === null || m.pipeline.arr === 0) return { status: "bad", label: "Sin pipeline", detail: "No hay deals en negociación con ARR" };
    if (c >= 1) return { status: "ok", label: "Pipeline suficiente", detail: "El pipeline cubre la brecha" };
    if (c >= 0.5) return { status: "warn", label: "Cobertura parcial", detail: "El pipeline cubre parte de la brecha" };
    return { status: "bad", label: "Cobertura baja", detail: "El pipeline cubre menos de la mitad de la brecha" };
  }
  if (id === 2) {
    const m = d.m2;
    if (!m) return none;
    const faltan = n0(m.pae.sinDato) > 0 || n0(m.ops.necesitanCalif) > 0;
    return faltan
      ? { status: "warn", label: "Faltan datos", detail: "Hay contratos sin dato de PAE o PAE sin calificación" }
      : { status: "ok", label: "En medición", detail: "Datos completos" };
  }
  if (id === 3) {
    const m = d.m3;
    if (!m) return none;
    if (n0(m.candidatos) === 0) return { status: "neutral", label: "Sin candidatos", detail: "Aún no hay candidatos registrados" };
    const blancos = m.completar.reduce((t, c) => t + n0(c.sinCalificacion) + n0(c.sinComentario) + n0(c.sinDecision), 0);
    const sinDecision = m.pendientes.find((p) => p.label.startsWith("Entrevistas o pruebas hechas"))?.n ?? 0;
    return blancos + n0(sinDecision) > 0
      ? { status: "warn", label: "Hay pendientes", detail: "Hay decisiones o campos por completar" }
      : { status: "ok", label: "Al día", detail: "Sin pendientes" };
  }
  if (id === 4) {
    const m = d.m4;
    if (!m) return none;
    const hayTareas = n0(m.deckDR.tareas[2]) > 0 || n0(m.manuales.plan) > 0;
    if (!hayTareas) return { status: "neutral", label: "Sin plan cargado", detail: "Aún no hay tareas ni manuales" };
    if (n0(m.deckDR.vencidas[2]) > 0 || n0(m.manuales.vencidos) > 0) return { status: "bad", label: "Con atrasos", detail: "Hay tareas o manuales vencidos" };
    if (n0(m.deckDR.bloqueadas[2]) > 0 || n0(m.manuales.sinImplementar) > 0) return { status: "warn", label: "Con bloqueos", detail: "Hay bloqueos o manuales sin implementar" };
    return { status: "ok", label: "En curso", detail: "Sin atrasos" };
  }
  const m = d.m5;
  if (!m) return none;
  if (n0(m.control.pubs) === 0) return { status: "neutral", label: "Sin publicaciones", detail: "La campaña aún no tiene publicaciones registradas" };
  if (n0(m.control.vencidas) > 0) return { status: "bad", label: "Con atrasos", detail: "Hay publicaciones vencidas sin publicar" };
  const cump = m.panel.find((p) => p.pregunta.startsWith("¿Cumple el equipo"));
  if (n0(m.control.pendientesEquipo) + n0(m.control.pendientesMarketing) > 0 || cump?.lectura === "Bajo meta")
    return { status: "warn", label: "Con pendientes", detail: "Hay métricas por registrar o cumplimiento bajo la meta" };
  return { status: "ok", label: "Al día", detail: "Sin pendientes" };
}
