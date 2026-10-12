import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { getDashboard } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Diagnóstico de la conexión: indica el modo, qué metas se leyeron bien y los errores. No expone datos ni llaves. */
export async function GET() {
  const d = await getDashboard();
  return NextResponse.json({
    mode: config.mode,
    hasServiceAccount: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    sheetMetasConfigured: Boolean(config.metasSheetId),
    sheetM3Configured: Boolean(config.m3SheetId),
    metas: { m1: Boolean(d.m1), m2: Boolean(d.m2), m3: Boolean(d.m3), m4: Boolean(d.m4), m5: Boolean(d.m5) },
    arrActualLeido: d.m1?.arrActual ?? null,
    errors: d.errors,
    fetchedAt: d.fetchedAt,
  });
}
