export type Cell = string | number | boolean | null | undefined;
export type Rows = Cell[][];
export type Section = { title: string; rows: Cell[][] };

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

export const str = (v: Cell): string => (v === null || v === undefined ? "" : String(v).trim());

/** Número si la celda es numérica; null si está vacía o tiene texto como "Sin dato". */
export function num(v: Cell): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (t !== "" && !Number.isNaN(Number(t))) return Number(t);
  }
  return null;
}

/** Fecha serial de Google Sheets a "YYYY-MM-DD". */
export function isoDate(v: Cell): string | null {
  const n = num(v);
  if (n === null || n < 20000) return null;
  return new Date((Math.floor(n) - 25569) * 86400000).toISOString().slice(0, 10);
}

/**
 * Divide una pestaña en secciones usando los títulos esperados, en orden. Cada título se busca por prefijo
 * (sin tildes ni mayúsculas) en la columna A. Así los datos se leen por etiqueta y no por número de fila:
 * si cambias de lugar una fila dentro de su sección, el sitio la sigue encontrando.
 */
export function sections(rows: Rows, titles: string[]): Section[] {
  const wanted = titles.map(norm);
  const out: Section[] = [];
  let next = 0;
  let cur: Section | null = null;
  for (const r of rows) {
    const row = r ?? [];
    const a = norm(str(row[0]));
    let hit = -1;
    if (a !== "") {
      for (let j = next; j < wanted.length; j++) {
        if (a.startsWith(wanted[j])) {
          hit = j;
          break;
        }
      }
    }
    if (hit >= 0) {
      cur = { title: str(row[0]), rows: [] };
      out.push(cur);
      next = hit + 1;
    } else if (cur) {
      cur.rows.push(row);
    }
  }
  return out;
}

export function findSection(secs: Section[], prefix: string): Section | undefined {
  const p = norm(prefix);
  return secs.find((s) => norm(s.title).startsWith(p));
}

/** Fila de una sección cuya etiqueta (columna A) empieza con el prefijo. */
export function findRow(sec: Section | undefined, labelPrefix: string): Cell[] | undefined {
  if (!sec) return undefined;
  const p = norm(labelPrefix);
  return sec.rows.find((r) => norm(str(r[0])).startsWith(p));
}

export function kv(sec: Section | undefined, labelPrefix: string, col = 1): Cell {
  return findRow(sec, labelPrefix)?.[col];
}

/** Convierte una tabla (primera fila = encabezados) en objetos. */
export function tableRows(sec: Section | undefined, keepIf: (r: Cell[]) => boolean = (r) => str(r[1]) !== ""): Cell[][] {
  if (!sec) return [];
  return sec.rows.slice(1).filter((r) => str(r[0]) !== "" && keepIf(r));
}

/** Para pestañas con una tabla de encabezado fijo (M1 ARR, M2 PAE): devuelve objetos por nombre de columna. */
export function tableByHeader(rows: Rows, firstHeader: string): Record<string, Cell>[] {
  const hi = rows.findIndex((r) => str(r?.[0]) === firstHeader);
  if (hi < 0) return [];
  const header = (rows[hi] ?? []).map(str);
  return rows.slice(hi + 1).map((r) => {
    const o: Record<string, Cell> = {};
    header.forEach((h, i) => {
      if (h) o[h] = r?.[i];
    });
    return o;
  });
}

/** Dentro de una sección, localiza la fila de encabezado (primera celda igual a `key`) y devuelve encabezados y filas siguientes. */
export function tableIn(sec: Section | undefined, key: string): { headers: string[]; rows: Cell[][] } {
  if (!sec) return { headers: [], rows: [] };
  const i = sec.rows.findIndex((r) => norm(str(r?.[0])) === norm(key));
  if (i < 0) return { headers: [], rows: [] };
  return { headers: (sec.rows[i] ?? []).map(str), rows: sec.rows.slice(i + 1) };
}

/** Valor para mostrar: número, texto o null si está vacío. */
export function val(v: Cell): number | string | null {
  const n = num(v);
  if (n !== null) return n;
  const t = str(v);
  return t === "" ? null : t;
}
