export type DataMode = "live" | "demo";

const hasCreds = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

export const config = {
  mode: ((process.env.DATA_MODE as DataMode | undefined) ?? (hasCreds ? "live" : "demo")) as DataMode,
  metasSheetId: process.env.SHEET_METAS_ID ?? "",
  m3SheetId: process.env.SHEET_M3_ID ?? "",
  revalidate: Number(process.env.REVALIDATE_SECONDS ?? 300),
  // Primer lunes (fecha límite) que cuenta para los puntos de incumplimiento de updates. Formato AAAA-MM-DD.
  trackingStart: process.env.TRACKING_START ?? (hasCreds || process.env.DATA_MODE === "live" ? "2026-10-19" : "2026-09-21"),
};

// Pestañas y rangos que se leen. Solo hojas de cálculo e indicadores: nunca datos personales ni salarios.
export const METAS_RANGES: Record<string, string> = {
  "M1 Cálculos": "A1:H80",
  "M1 ARR": "A1:V104",
  "M1 Desempeño": "A1:T120",
  "M2 Cálculos": "A1:D45",
  "M2 PAE": "A1:Q44",
  "M4 Indicadores": "A1:E60",
};
export const M5_RANGES: Record<string, string> = {
  "M5 Indicadores E": "A1:O90",
  "M5 Análisis E": "A1:N174",
  "M5 Canales Marketing E": "A1:J100",
};
export const UPDATES_RANGES: Record<string, string> = {
  "Updates de metas": "A1:F500",
};
export const M3_RANGES: Record<string, string> = {
  "M3 Indicadores": "A1:F100",
};
