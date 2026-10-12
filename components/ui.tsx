import Link from "next/link";
import type { ReactNode } from "react";
import type { DashboardData, Status } from "@/lib/types";
import { dateTimeLabel } from "@/lib/format";

export function StatusPill({ status, label }: { status: Status; label: string }) {
  return (
    <span className={`pill ${status}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

export function Kpi({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return (
    <div className="card kpi">
      <div className={`v${accent ? " accent" : ""}`}>{value}</div>
      <div className="l">{label}</div>
      {sub ? <div className="s">{sub}</div> : null}
    </div>
  );
}

/** Barra de avance. `base` pinta en un tono suave lo que ya estaba hecho antes del plan. */
export function ProgressBar({ value, base, large, left, right }: { value: number | null; base?: number | null; large?: boolean; left?: ReactNode; right?: ReactNode }) {
  const v = Math.max(0, Math.min(1, value ?? 0));
  const b = Math.min(v, Math.max(0, base ?? 0));
  return (
    <div>
      <div className={`bar${large ? " lg" : ""}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)}>
        {b > 0 ? <i className="base" style={{ left: 0, width: `${b * 100}%` }} /> : null}
        <i className="top" style={{ left: `${b * 100}%`, width: `${Math.max(0, v - b) * 100}%` }} />
      </div>
      {left || right ? (
        <div className="bar-meta">
          <span>{left}</span>
          <span>{right}</span>
        </div>
      ) : null}
    </div>
  );
}

export type SplitPart = { label: string; value: number | null; color: string };
export function SplitBar({ parts, format }: { parts: SplitPart[]; format?: (n: number) => string }) {
  const clean = parts.map((p) => ({ ...p, value: p.value ?? 0 }));
  const total = clean.reduce((s, p) => s + p.value, 0);
  const f = format ?? ((n: number) => String(Math.round(n)));
  if (total <= 0) return <div className="empty">Sin datos todavía</div>;
  return (
    <div>
      <div className="split" role="img" aria-label={clean.map((p) => `${p.label}: ${f(p.value)}`).join(", ")}>
        {clean.filter((p) => p.value > 0).map((p) => (
          <i key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} title={`${p.label}: ${f(p.value)}`} />
        ))}
      </div>
      <div className="legend">
        {clean.map((p) => (
          <span key={p.label}>
            <span className="sw" style={{ background: p.color }} />
            {p.label} <b>{f(p.value)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="sec">{title}</h2>
      {sub ? <p className="sec-sub">{sub}</p> : null}
      {children}
    </section>
  );
}

export function PageHead({ eyebrow, title, lede, children }: { eyebrow: string; title: string; lede?: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <div className="rule" />
      {lede ? <p className="lede">{lede}</p> : null}
      {children}
    </header>
  );
}

export function Banners({ d }: { d: DashboardData }) {
  return (
    <>
      {d.mode === "demo" ? (
        <div className="banner">Datos de prueba: este tablero muestra información de ejemplo, no cifras reales.</div>
      ) : null}
      {d.errors.length > 0 ? (
        <div className="banner bad">
          No se pudo leer parte de la información: {d.errors.join(" · ")}
        </div>
      ) : null}
    </>
  );
}

export function Updated({ d }: { d: DashboardData }) {
  return <span className="chip">Actualizado: {dateTimeLabel(d.fetchedAt)}</span>;
}

export function Back() {
  return (
    <Link href="/" className="back">
      ← Resumen de metas
    </Link>
  );
}

export function Table({ head, rows, align, hl, min }: { head: string[]; rows: ReactNode[][]; align?: ("l" | "r")[]; hl?: number[]; min?: number }) {
  if (rows.length === 0) return <div className="empty">Sin datos todavía</div>;
  return (
    <div className="tscroll">
      <table className="t" style={min ? { minWidth: min } : undefined}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h + i} className={align?.[i] === "r" ? "r" : ""}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={hl?.includes(i) ? "hl" : ""}>
              {r.map((c, j) => (
                <td key={j} className={align?.[j] === "r" ? "r" : ""}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function alertStatus(a: string): Status {
  if (!a || a === "OK" || a === "Entregada" || a === "Lista") return "ok";
  if (a.startsWith("Falta") || a.startsWith("Vencid") || a === "Sin registro" || a === "Actualizar" || a === "Cierre vencido" || a === "Bloqueada") return "bad";
  return "warn";
}
