import { METAS } from "./status";
import type { UpdateRow, UpdatesSummary, WeekCell } from "./types";

const DAY = 86400000;
const BOGOTA_OFFSET_MS = 5 * 3600 * 1000; // Bogotá es UTC-5 y no cambia de hora
const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const todayBogota = (now = Date.now()) => toIso(now - BOGOTA_OFFSET_MS);

/**
 * Cada semana cierra el lunes a la medianoche (hora de Bogotá). Un update fechado entre el martes y el lunes
 * cuenta para el lunes que cierra esa semana. Devuelve ese lunes (si la fecha ya es lunes, es el mismo día).
 */
export function deadlineOf(iso: string): string {
  const dow = new Date(toMs(iso)).getUTCDay(); // 0 domingo ... 1 lunes
  return toIso(toMs(iso) + ((1 - dow + 7) % 7) * DAY);
}

export function summarize(rows: UpdateRow[], startDeadline: string, now = Date.now()): UpdatesSummary {
  const today = todayBogota(now);
  const deadline = deadlineOf(today);
  const daysLeft = Math.round((toMs(deadline) - toMs(today)) / DAY);
  const started = toMs(startDeadline) <= toMs(deadline);

  const weeks: string[] = [];
  for (let t = toMs(started ? startDeadline : deadline); t <= toMs(deadline); t += 7 * DAY) weeks.push(toIso(t));
  const shown = weeks.slice(-8);

  // metas con update en cada semana (se ignoran fechas futuras)
  const done = new Map<string, Set<number>>();
  const latest: Record<number, UpdateRow | null> = { 1: null, 2: null, 3: null, 4: null, 5: null };
  for (const u of rows) {
    if (u.fecha > today) continue;
    const d = deadlineOf(u.fecha);
    if (!done.has(d)) done.set(d, new Set());
    done.get(d)!.add(u.meta);
    if (!latest[u.meta] || u.fecha >= latest[u.meta]!.fecha) latest[u.meta] = u;
  }

  const matrix: Record<number, Record<string, WeekCell>> = {};
  const pointsBy = new Map<string, number>();
  METAS.forEach((m) => pointsBy.set(m.pointsOwner, pointsBy.get(m.pointsOwner) ?? 0));
  for (const m of METAS) {
    matrix[m.id] = {};
    for (const w of shown) {
      const has = done.get(w)?.has(m.id) ?? false;
      matrix[m.id][w] = has ? "ok" : w < deadline ? "miss" : "open";
    }
    if (started) {
      for (const w of weeks) {
        if (w < deadline && !(done.get(w)?.has(m.id) ?? false)) pointsBy.set(m.pointsOwner, (pointsBy.get(m.pointsOwner) ?? 0) + 1);
      }
    }
  }

  return {
    today, deadline, daysLeft, startDeadline, started,
    current: METAS.map((m) => ({
      meta: m.id,
      owner: m.owner,
      done: done.get(deadline)?.has(m.id) ?? false,
      lastDate: latest[m.id]?.fecha ?? null,
    })),
    weeks: shown,
    matrix,
    points: [...pointsBy.entries()].map(([owner, points]) => ({ owner, points })).sort((a, b) => b.points - a.points),
    latest,
    total: rows.length,
  };
}
