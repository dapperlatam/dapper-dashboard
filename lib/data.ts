import { config, METAS_RANGES, M3_RANGES, UPDATES_RANGES } from "./config";
import { readTabs } from "./sheets";
import type { DashboardData } from "./types";
import type { Rows } from "./parse/util";
import { parseM1 } from "./parse/m1";
import { parseM2 } from "./parse/m2";
import { parseM3 } from "./parse/m3";
import { parseM4 } from "./parse/m4";
import { parseM5 } from "./parse/m5";
import { parseUpdates } from "./parse/updates";
import { summarize } from "./updates";
import metasDemo from "./demo/metas.json";
import m3Demo from "./demo/m3.json";

export async function getDashboard(): Promise<DashboardData> {
  const errors: string[] = [];
  let metas: Record<string, Rows> | null = null;
  let m3: Record<string, Rows> | null = null;
  let upd: Record<string, Rows> | null = null;

  if (config.mode === "demo") {
    metas = metasDemo as unknown as Record<string, Rows>;
    m3 = m3Demo as unknown as Record<string, Rows>;
    upd = metasDemo as unknown as Record<string, Rows>;
  } else {
    try {
      metas = await readTabs(config.metasSheetId, METAS_RANGES);
    } catch (e) {
      errors.push(`Sheet de metas 1, 2, 4 y 5: ${(e as Error).message}`);
    }
    try {
      upd = await readTabs(config.metasSheetId, UPDATES_RANGES);
    } catch {
      errors.push("Falta la pestaña «Updates de metas» en el Sheet de metas (o no se pudo leer). Créala con ese nombre exacto.");
    }
    try {
      m3 = await readTabs(config.m3SheetId, M3_RANGES);
    } catch (e) {
      errors.push(`Sheet de la meta 3: ${(e as Error).message}`);
    }
  }

  const safe = <T,>(name: string, fn: () => T): T | null => {
    try {
      return fn();
    } catch (e) {
      errors.push(`${name}: ${(e as Error).message}`);
      return null;
    }
  };
  const tab = (src: Record<string, Rows> | null, name: string): Rows => src?.[name] ?? [];

  return {
    mode: config.mode,
    fetchedAt: new Date().toISOString(),
    errors,
    m1: metas ? safe("Meta 1", () => parseM1(tab(metas, "M1 Cálculos"), tab(metas, "M1 ARR"))) : null,
    m2: metas ? safe("Meta 2", () => parseM2(tab(metas, "M2 Cálculos"), tab(metas, "M2 PAE"))) : null,
    m3: m3 ? safe("Meta 3", () => parseM3(tab(m3, "M3 Indicadores"))) : null,
    m4: metas ? safe("Meta 4", () => parseM4(tab(metas, "M4 Indicadores"))) : null,
    m5: metas ? safe("Meta 5", () => parseM5(tab(metas, "M5 Indicadores"))) : null,
    updates: upd ? safe("Updates de metas", () => summarize(parseUpdates(tab(upd, "Updates de metas")), config.trackingStart)) : null,
  };
}
