import type { Num } from "./types";

const group = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const comma = (s: string) => s.replace(".", ",");

export const NA = "—";

export function int(n: Num): string {
  return n === null ? NA : group(Math.round(n).toString());
}
export function dec(n: Num, d = 1): string {
  return n === null ? NA : comma(n.toFixed(d));
}
export function usd(n: Num): string {
  if (n === null) return NA;
  const a = Math.abs(n);
  if (a >= 1e6) return `$${comma((n / 1e6).toFixed(2))} M`;
  if (a >= 1e4) return `$${group(Math.round(n / 1e3).toString())} k`;
  return `$${group(Math.round(n).toString())}`;
}
export function usdFull(n: Num): string {
  return n === null ? NA : `$${group(Math.round(n).toString())}`;
}
export function pct(n: Num, d = 0): string {
  return n === null ? NA : `${comma((n * 100).toFixed(d))}%`;
}
export function times(n: Num, d = 1): string {
  return n === null ? NA : `${comma(n.toFixed(d))}×`;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function dateLabel(iso: string | null, withYear = true): string {
  if (!iso) return NA;
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]}${withYear ? ` ${y}` : ""}`;
}
export function monthLabel(iso: string | null): string {
  if (!iso) return "";
  const [y, m] = iso.split("-").map(Number);
  return `${MESES[m - 1]} ${String(y).slice(2)}`;
}
export function dateTimeLabel(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d);
  return parts;
}
export const n0 = (n: Num) => n ?? 0;
