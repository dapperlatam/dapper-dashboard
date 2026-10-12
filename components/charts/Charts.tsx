"use client";
import {
  Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList,
} from "recharts";

type Fmt = "num" | "usd" | "pct" | "dec";
type Series = { key: string; name: string; color?: string };
const PALETTE = ["var(--accent)", "var(--accent-light)", "var(--accent-lighter)", "var(--gray)", "var(--gray-light)"];

const group = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
function fmt(n: number, f: Fmt): string {
  if (f === "usd") {
    const a = Math.abs(n);
    if (a >= 1e6) return `$${(n / 1e6).toFixed(1).replace(".", ",")} M`;
    if (a >= 1e3) return `$${Math.round(n / 1e3)} k`;
    return `$${Math.round(n)}`;
  }
  if (f === "pct") return `${(n * 100).toFixed(0)}%`;
  if (f === "dec") return n.toFixed(1).replace(".", ",");
  return group(Math.round(n).toString());
}

const tick = { fill: "var(--ink-soft)", fontSize: 12 };
const tip = {
  contentStyle: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12.5, color: "var(--ink)" },
  labelStyle: { color: "var(--ink)", fontWeight: 600 },
  itemStyle: { color: "var(--ink-soft)" },
  cursor: { fill: "var(--surface-3)", opacity: 0.6 },
};

export function ColumnChart({ data, xKey, series, format = "num", height = 240, stacked = false }: {
  data: Record<string, string | number | null>[]; xKey: string; series: Series[]; format?: Fmt; height?: number; stacked?: boolean;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey={xKey} tick={tick} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval="preserveStartEnd" />
          <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(Number(v), format)} width={62} allowDecimals={format === "dec"} />
          <Tooltip {...tip} formatter={(v: number) => fmt(Number(v), format)} />
          {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-soft)" }} /> : null}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color ?? PALETTE[i % PALETTE.length]} stackId={stacked ? "a" : undefined} radius={stacked ? 0 : [4, 4, 0, 0]} maxBarSize={44} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HBarChart({ data, series, format = "num", rowHeight = 34, stacked = false, labelWidth = 150 }: {
  data: Record<string, string | number | null>[]; series: Series[]; format?: Fmt; rowHeight?: number; stacked?: boolean; labelWidth?: number;
}) {
  const h = Math.max(120, data.length * rowHeight * (stacked ? 1 : Math.max(1, series.length * 0.75)) + 36);
  return (
    <div style={{ width: "100%", height: h }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={tick} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(Number(v), format)} allowDecimals={format === "dec"} />
          <YAxis type="category" dataKey="name" tick={tick} tickLine={false} axisLine={false} width={labelWidth} />
          <Tooltip {...tip} formatter={(v: number) => fmt(Number(v), format)} />
          {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-soft)" }} /> : null}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color ?? PALETTE[i % PALETTE.length]} stackId={stacked ? "a" : undefined} radius={stacked ? 0 : [0, 4, 4, 0]} maxBarSize={22}>
              {series.length === 1 ? <LabelList dataKey={s.key} position="right" formatter={(v: number) => fmt(Number(v), format)} style={{ fill: "var(--ink-soft)", fontSize: 12 }} /> : null}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScenarioChart({ data, meta }: { data: { name: string; value: number }[]; meta: number | null }) {
  const h = Math.max(190, data.length * 58 + 40);
  return (
    <div style={{ width: "100%", height: h }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 22, right: 48, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={tick} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(Number(v), "usd")} domain={[0, (max: number) => Math.max(max, meta ?? 0) * 1.12]} />
          <YAxis type="category" dataKey="name" tick={tick} tickLine={false} axisLine={false} width={150} />
          <Tooltip {...tip} formatter={(v: number) => fmt(Number(v), "usd")} />
          {meta ? <ReferenceLine x={meta} stroke="var(--brass)" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: `Meta ${fmt(meta, "usd")}`, position: "top", fill: "var(--brass)", fontSize: 12 }} /> : null}
          <Bar dataKey="value" name="ARR proyectado" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={30}>
            <LabelList dataKey="value" position="right" formatter={(v: number) => fmt(Number(v), "usd")} style={{ fill: "var(--ink-soft)", fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
