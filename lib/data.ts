import { config, METAS_RANGES, M3_RANGES, M5_RANGES, UPDATES_RANGES } from "./config";
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

/** Traduce los errores técnicos de Google a una instrucción que se pueda seguir. */
function explain(e: unknown): string {
  const m = (e as Error)?.message ?? String(e);
  if (/DECODER|PEM|private key|invalid_grant|JSON|Unexpected token/i.test(m))
    return "La llave de la cuenta de servicio no es válida: pega el contenido completo del JSON en GOOGLE_SERVICE_ACCOUNT_JSON.";
  if (m.includes("403"))
    return "Sin permiso: comparte el Sheet con el correo de la cuenta de servicio (permiso de Lector) y verifica que la Google Sheets API esté habilitada.";
  if (m.includes("404")) return "No se encontró el Sheet: revisa el ID.";
  if (m.includes("400")) return "No se encontró alguna pestaña o rango: revisa que los nombres de las pestañas no hayan cambiado.";
  if (m.startsWith("Falta")) return m;
  return m.slice(0, 200);
}

export async function getDashboard(): Promise<DashboardData> {
  const errors: string[] = [];
  let metas: Record<string, Rows> | null = null;
  let m3: Record<string, Rows> | null = null;
  let upd: Record<string, Rows> | null = null;
  let m5src: Record<string, Rows> | null = null;

  if (config.mode === "demo") {
    metas = metasDemo as unknown as Record<string, Rows>;
    m3 = m3Demo as unknown as Record<string, Rows>;
    upd = metasDemo as unknown as Record<string, Rows>;
    m5src = metasDemo as unknown as Record<string, Rows>;
  } else {
    try {
      metas = await readTabs(config.metasSheetId, METAS_RANGES);
    } catch (e) {
      errors.push(`Sheet de metas 1, 2, 4 y 5: ${explain(e)}`);
    }
    try {
      m5src = await readTabs(config.metasSheetId, M5_RANGES);
    } catch (e) {
      const m = (e as Error)?.message ?? "";
      errors.push(m.includes("400")
        ? "Meta 5: no se encontró alguna de las pestañas «M5 Indicadores E», «M5 Análisis E» o «M5 Canales Marketing E». Revisa que sigan con ese nombre."
        : `Meta 5: ${explain(e)}`);
    }
    try {
      upd = await readTabs(config.metasSheetId, UPDATES_RANGES);
    } catch (e) {
      const m = (e as Error)?.message ?? "";
      errors.push(m.includes("400")
        ? "Falta la pestaña «Updates de metas» en el Sheet de metas. Créala con ese nombre exacto (archivo Updates_de_metas.xlsx)."
        : `Updates de metas: ${explain(e)}`);
    }
    try {
      m3 = await readTabs(config.m3SheetId, M3_RANGES);
    } catch (e) {
      errors.push(`Sheet de la meta 3: ${explain(e)}`);
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
    m1: metas ? safe("Meta 1", () => parseM1(tab(metas, "M1 Cálculos"), tab(metas, "M1 ARR"), tab(metas, "M1 Desempeño"))) : null,
    m2: metas ? safe("Meta 2", () => parseM2(tab(metas, "M2 Cálculos"), tab(metas, "M2 PAE"))) : null,
    m3: m3 ? safe("Meta 3", () => parseM3(tab(m3, "M3 Indicadores PAE"))) : null,
    m4: metas ? safe("Meta 4", () => parseM4(tab(metas, "M4 Indicadores"))) : null,
    m5: m5src ? safe("Meta 5", () => parseM5(tab(m5src, "M5 Indicadores E"), tab(m5src, "M5 Análisis E"), tab(m5src, "M5 Canales Marketing E"))) : null,
    updates: upd ? safe("Updates de metas", () => summarize(parseUpdates(tab(upd, "Updates de metas")), config.trackingStart)) : null,
  };
}
