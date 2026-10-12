import type { M5Data, M5Group } from "@/lib/types";
import { dec, int, monthLabel, dateLabel, pct } from "@/lib/format";
import { Kpi, Section, Table } from "@/components/ui";
import { ColumnChart, HBarChart } from "@/components/charts/Charts";

const RUBROS = ["Vistas", "Reacciones", "Comentarios", "Compartidos", "Interacciones"];

function trim<T extends { pubs: number | null; vistas: number | null; interacciones: number | null }>(rows: T[]): T[] {
  const idx = rows.map((r, i) => ((r.pubs ?? 0) > 0 || (r.vistas ?? 0) > 0 ? i : -1)).filter((i) => i >= 0);
  if (idx.length === 0) return [];
  return rows.slice(idx[0], idx[idx.length - 1] + 1);
}

function Leaders({ title, g }: { title: string; g: M5Group }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="sub">Líder en cada métrica, por total y por promedio por publicación.</p>
      <Table
        head={["Métrica", "Por total", "Por promedio"]}
        rows={RUBROS.map((r, i) => [r, g.leaderTotal[i] || "—", g.leaderAvg[i] || "—"])}
      />
    </div>
  );
}

export function M5View({ m }: { m: M5Data }) {
  const r = m.resumen;
  const mk = (rows: (typeof m.meses), label: (f: string | null) => string) =>
    trim(rows).map((x) => ({ name: label(x.fecha), vistas: x.vistas ?? 0, reacciones: x.reacciones ?? 0, comentarios: x.comentarios ?? 0, compartidos: x.compartidos ?? 0 }));
  const meses = mk(m.meses, monthLabel);
  const semanas = mk(m.semanas, (f) => dateLabel(f, false));
  const INTER = [
    { key: "reacciones", name: "Reacciones", color: "var(--accent)" },
    { key: "comentarios", name: "Comentarios", color: "var(--accent-light)" },
    { key: "compartidos", name: "Compartidos", color: "var(--accent-lighter)" },
  ];
  const VIST = [{ key: "vistas", name: "Vistas", color: "var(--accent)" }];
  const empty = <p className="empty">Aún no hay publicaciones con métricas en este período.</p>;
  const fmtRows = m.formato.totals.filter((x) => (x.pubs ?? 0) > 0);
  const perRows = m.persona.totals.filter((x) => (x.pubs ?? 0) > 0);
  return (
    <>
      <div className="grid g6 kpis">
        <Kpi label="Publicaciones hechas" value={int(r.pubs)} accent />
        <Kpi label="Vistas" value={int(r.vistas)} sub={`${int(r.vistasPorPub)} por publicación`} />
        <Kpi label="Interacciones" value={int(r.interacciones)} sub={`${dec(r.interaccionesPorPub)} por publicación`} />
        <Kpi label="Compartidos" value={int(r.compartidos)} sub={`${int(r.comentarios)} comentarios`} />
        <Kpi label="Publicadas a tiempo" value={pct(r.aTiempo)} />
        <Kpi label="Pendientes y vencidas" value={`${int(r.pendientes)} · ${int(r.vencidas)}`} />
      </div>

      <Section title="Vistas e interacciones en el tiempo" sub="Por mes y por semana de publicación. Interacciones = reacciones + comentarios + compartidos.">
        <div className="grid g2">
          <div className="card"><h3>Vistas por mes</h3>{meses.length ? <ColumnChart data={meses} xKey="name" series={VIST} height={220} /> : empty}</div>
          <div className="card"><h3>Interacciones por mes</h3>{meses.length ? <ColumnChart data={meses} xKey="name" series={INTER} stacked height={220} /> : empty}</div>
          <div className="card"><h3>Vistas por semana</h3>{semanas.length ? <ColumnChart data={semanas} xKey="name" series={VIST} height={220} /> : empty}</div>
          <div className="card"><h3>Interacciones por semana</h3>{semanas.length ? <ColumnChart data={semanas} xKey="name" series={INTER} stacked height={220} /> : empty}</div>
        </div>
      </Section>

      <Section title="Qué formato funciona mejor" sub="Totales por formato y promedio por publicación.">
        <div className="grid g2">
          <div className="card">
            <h3>Interacciones por formato</h3>
            {fmtRows.length ? (
              <HBarChart data={fmtRows.map((x) => ({ name: x.name, value: x.interacciones ?? 0 }))} series={[{ key: "value", name: "Interacciones" }]} labelWidth={90} />
            ) : <p className="empty">Sin datos todavía</p>}
          </div>
          <div className="card">
            <h3>Detalle por formato</h3>
            <Table
              head={["Formato", "Pubs", "Vistas", "Interac.", "Interac./pub"]}
              align={["l", "r", "r", "r", "r"]}
              rows={fmtRows.map((x) => {
                const a = m.formato.averages.find((y) => y.name === x.name);
                return [x.name, int(x.pubs), int(x.vistas), int(x.interacciones), dec(a?.interacciones ?? null)];
              })}
            />
          </div>
        </div>
        <div style={{ height: 16 }} />
        <Leaders title="Formato líder" g={m.formato} />
      </Section>

      <Section title="Quién tiene más alcance" sub="Totales por persona y promedio por publicación. El promedio puede favorecer a quien tiene pocas publicaciones: conviene leerlo junto al total.">
        <div className="grid g2">
          <div className="card">
            <h3>Interacciones por persona</h3>
            {perRows.length ? (
              <HBarChart data={perRows.map((x) => ({ name: x.name, value: x.interacciones ?? 0 }))} series={[{ key: "value", name: "Interacciones" }]} labelWidth={150} />
            ) : <p className="empty">Sin datos todavía</p>}
          </div>
          <div className="card">
            <h3>Detalle por persona</h3>
            <Table
              head={["Persona", "Pubs", "Vistas", "Interac.", "Vistas/pub"]}
              align={["l", "r", "r", "r", "r"]}
              rows={perRows.map((x) => {
                const a = m.persona.averages.find((y) => y.name === x.name);
                return [x.name, int(x.pubs), int(x.vistas), int(x.interacciones), int(a?.vistas ?? null)];
              })}
            />
          </div>
        </div>
        <div style={{ height: 16 }} />
        <Leaders title="Persona líder" g={m.persona} />
      </Section>
    </>
  );
}
