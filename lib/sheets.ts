import { JWT } from "google-auth-library";
import { config } from "./config";
import type { Rows } from "./parse/util";

async function accessToken(): Promise<string> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_JSON");
  const creds = JSON.parse(raw);
  const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const t = await client.getAccessToken();
  if (!t.token) throw new Error("No se pudo obtener el token de Google");
  return t.token;
}

/** Lee varias pestañas de un Sheet en una sola llamada. Devuelve { nombreDePestaña: filas }. */
export async function readTabs(spreadsheetId: string, ranges: Record<string, string>): Promise<Record<string, Rows>> {
  if (!spreadsheetId) throw new Error("Falta el ID del Google Sheet");
  const token = await accessToken();
  const tabs = Object.keys(ranges);
  const params = new URLSearchParams({
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
    majorDimension: "ROWS",
  });
  for (const tab of tabs) params.append("ranges", `'${tab}'!${ranges[tab]}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: config.revalidate },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Sheets respondió ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { valueRanges?: { values?: Rows }[] };
  const out: Record<string, Rows> = {};
  tabs.forEach((tab, i) => {
    out[tab] = json.valueRanges?.[i]?.values ?? [];
  });
  return out;
}
