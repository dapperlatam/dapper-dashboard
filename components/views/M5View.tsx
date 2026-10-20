import type { M5Canal, M5Data, M5Dim, M5Kind, M5PanelRow, Num, Status } from "@/lib/types";
import { dateLabel, dec, int, monthLabel, pct } from "@/lib/format";
import { Kpi, Section, StatusPill, Table } from "@/components/ui";
import { ColumnChart, HBarChart } from "@/components/charts/Charts";

const NA = "—";
const sgn = (n: Num) => (n === null ? NA : `${n >= 0 ? "+" : "−"}${Math.abs(n * 100).toFixed(0)}%`);

function show(kind: M5Kind, v: number | string | null): string {
  if (v === null) return NA;
  if (typeof v === "string") return v;
  if (kind === "pct0") return pct(v);
  if (kind === "pct1") return pct(v, 1);
  return int(v);
}

function lectura(l: string): Status {
  if (l === "En meta" || l === "Sube") return "ok";
  if (l === "Bajo meta" || l === "Baja" || l === "Sin crecimiento") return "warn";
  return "neutral";
}

function PanelCard({ r }: { r: M5PanelRow }) {
  const parts: string[] = [];
  if (r.ref !== null) parts.push(`Referencia ${show(r.kind, r.ref)}`);
  if (r.cambio !== null) parts.push(`Cambio ${sgn(r.cambio)}`);
  if (r.meta !== null) parts.push(`Meta ${show(r.kind, r.meta)}`);
  const isText = typeof r.valor === "string";
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <h3 style={{ fontSize: 15 }}>{r.pregunta}</h3>
        {r.lectura ? <StatusPill status={lectura(r.lectura)} label={r.lectura} /> : null}
      </div>
      <p className="sub" style={{ marginBottom: 12 }}>{r.dato}</p>
      <div className="hero" style={{ fontSize: isText ? 22 : 34, color: isText && String(r.valor).startsWith("Sin") || String(r.valor).startsWith("Aún") ? "var(--ink-faint)" : "var(--accent)" }}>
        {show(r.kind, r.valor)}
      </div>
      {parts.length ? <p className="note" style={{ marginTop: 8 }}>{parts.join(" · ")}</p> : null}
    </div>
  );
}

const hasData = (m: M5Data) => (m.control.pubs ?? 0) > 0;
const IMP = <p className="empty">Aún no hay publicaciones con métricas. Se llena a medida que el equipo publique.</p>;

function DimCard({ d, minimo }: { d: M5Dim; minimo: Num }) {
  const rows = d.items.filter((x) => (x.pubs ?? 0) > 0);
  return (
    <div className="card">
      <h3>Por {d.titulo.replace(/^Por /i, "").toLowerCase()}</h3>
      <p className="sub">
        Mejor tasa de interacción: <b>{d.mejorTasa || NA}</b> · Más vistas por publicación: <b>{d.masVistas || NA}</b>
      </p>
      {rows.length === 0 ? (
        <p className="empty" style={{ padding: 0 }}>Sin publicaciones con métricas todavía.</p>
      ) : (
        <Table
          head={["", "Pubs", "Vistas/pub", "Tasa", "Tasa vs prom."]}
          align={["l", "r", "r", "r", "r"]}
          rows={rows.map((x) => [
            <span key="n">{x.name}{x.suficiente === "Sí" ? "" : <span className="muted"> · pocas pubs</span>}</span>,
            int(x.pubs), int(x.vistasPorPub), pct(x.tasa, 1),
            <span key="t" style={{ color: (x.vsTasa ?? 0) >= 0 ? "var(--good)" : "var(--bad)", fontWeight: 600 }}>{sgn(x.vsTasa)}</span>,
          ])}
        />
      )}
      {minimo !== null ? <p className="note">Se compara con {int(minimo)} o más publicaciones.</p> : null}
    </div>
  );
}

function CanalChart({ c }: { c: M5Canal }) {
  const MAIN: Record<string, string> = { blog: "Visitas al blog", pauta: "Clics", linkedin: "Seguidores al cierre del mes", instagram: "Seguidores al cierre del mes", sitio: "Visitas al sitio" };
  const key = MAIN[c.key];
  const data = c.meses.filter((m) => typeof m.v[key] === "number").map((m) => ({ name: monthLabel(m.mes), valor: m.v[key] as number }));
  const ref = c.antes && typeof c.antes[key] === "number" ? (c.antes[key] as number) : null;
  return (
    <div className="card">
      <h3>{c.titulo}</h3>
      <p className="sub">{key}, por mes. La línea dorada es el promedio de agosto y septiembre, antes de la campaña.</p>
      {data.length ? (
        <ColumnChart data={data} xKey="name" series={[{ key: "valor", name: key, color: "var(--accent)" }]} height={200} reference={ref} referenceLabel="Antes de la campaña" />
      ) : <p className="empty" style={{ padding: 0 }}>Sin datos registrados todavía.</p>}
    </div>
  );
}

export function M5View({ m }: { m: M5Data }) {
  const t = m.totales;
  const dataOn = hasData(m);
  // semanas desde el inicio del programa hasta la semana en curso (la última cerrada + 7 días)
  const corte = m.params.ultimaSemanaCerrada ? new Date(Date.parse(`${m.params.ultimaSemanaCerrada}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10) : null;
  const semanas = m.semanas.filter((s) => s.inicio && (m.params.inicio ? s.inicio >= m.params.inicio : true) && (corte ? s.inicio <= corte : true)).slice(0, 12);
  const semChart = semanas.map((s) => ({ name: dateLabel(s.inicio, false), pubs: s.pubs ?? 0, personas: s.personas ?? 0 }));
  const semVistas = semanas.map((s) => ({ name: dateLabel(s.inicio, false), vistas: s.vistas ?? 0, interacciones: s.interacciones ?? 0 }));
  const mesChart = m.meses.filter((x) => (x.pubs ?? 0) > 0 || (x.vistas ?? 0) > 0).map((x) => ({ name: monthLabel(x.inicio), vistas: x.vistas ?? 0, interacciones: x.interacciones ?? 0 }));
  const personas = m.personas.filter((p) => (p.pubs ?? 0) > 0);
  const quinc = m.quincenas.filter((q) => (q.pubs ?? 0) > 0);
  const a = m.analisis;
  return (
    <>
      <div className="grid g6 kpis">
        <Kpi label="Publicaciones hechas" value={int(m.control.pubs)} accent sub={`${int(m.control.conMetricas)} con métricas`} />
        <Kpi label="Vistas" value={int(t?.vistas ?? null)} sub={`Alcance ${int(t?.alcance ?? null)}`} />
        <Kpi label="Tasa de interacción" value={pct(t?.tasa ?? null, 1)} sub={`${int(t?.interacciones ?? null)} interacciones`} />
        <Kpi label="Mensajes o contactos" value={int(t?.mensajes ?? null)} sub="llegados por las publicaciones" />
        <Kpi label="Seguidores ganados" value={int(t?.seguidores ?? null)} sub={`${int(t?.visitasPerfil ?? null)} visitas al perfil`} />
        <Kpi label="Publicadas a tiempo" value={typeof m.control.aTiempo === "number" ? pct(m.control.aTiempo) : String(m.control.aTiempo ?? NA)} sub={`${int(m.control.vencidas)} vencidas sin publicar`} />
      </div>

      <Section title="Panel de la campaña" sub={`Voces Dapper: lectura rápida para la dirección.${m.params.inicio ? ` El programa ${(m.params.semanasCerradas ?? 0) > 0 ? "arrancó" : "arranca"} el ${dateLabel(m.params.inicio)}.` : ""}`}>
        <div className="grid g2">{m.panel.map((r) => <PanelCard key={r.pregunta + r.dato} r={r} />)}</div>
        <p className="note">Control del registro: {int(m.control.pendientesEquipo)} métricas pendientes de subir por el equipo y {int(m.control.pendientesMarketing)} por registrar en Marketing.</p>
      </Section>

      <Section title="Cumplimiento y ritmo" sub={`Meta: ${pct(m.params.metaCumplimiento)} del equipo publica cada semana. El cumplimiento cuenta semanas con al menos una publicación.`}>
        <div className="grid g2">
          <div className="card">
            <h3>Publicaciones y personas por semana</h3>
            {dataOn && semChart.length ? (
              <ColumnChart data={semChart} xKey="name" series={[{ key: "pubs", name: "Publicaciones", color: "var(--accent)" }, { key: "personas", name: "Personas que publicaron", color: "var(--accent-lighter)" }]} height={230} />
            ) : IMP}
          </div>
          <div className="card">
            <h3>Por quincena (ciclo de reporte)</h3>
            {quinc.length ? (
              <Table
                head={["Quincena", "Pubs", "Cumpl.", "Vistas", "Tasa"]}
                align={["l", "r", "r", "r", "r"]}
                rows={quinc.map((q) => [`${dateLabel(q.inicio, false)} a ${dateLabel(q.fin, false)}`, int(q.pubs), pct(q.cumplimiento), int(q.vistas), pct(q.tasa, 1)])}
              />
            ) : IMP}
          </div>
        </div>
      </Section>

      <Section title="Vistas e interacciones" sub="Por semana y por mes. Interacciones = reacciones + comentarios + compartidos.">
        <div className="grid g2">
          <div className="card"><h3>Por semana</h3>{dataOn && semVistas.length ? <ColumnChart data={semVistas} xKey="name" series={[{ key: "vistas", name: "Vistas", color: "var(--accent)" }, { key: "interacciones", name: "Interacciones", color: "var(--accent-lighter)" }]} height={230} /> : IMP}</div>
          <div className="card"><h3>Por mes</h3>{mesChart.length ? <ColumnChart data={mesChart} xKey="name" series={[{ key: "vistas", name: "Vistas", color: "var(--accent)" }, { key: "interacciones", name: "Interacciones", color: "var(--accent-lighter)" }]} height={230} /> : IMP}</div>
        </div>
      </Section>

      <Section title="Personas" sub="Cumplimiento y alcance de cada integrante del programa.">
        <div className="grid g2">
          <div className="card">
            <h3>Vistas por persona</h3>
            {personas.length ? <HBarChart data={personas.map((p) => ({ name: p.name, value: p.vistas ?? 0 }))} series={[{ key: "value", name: "Vistas" }]} labelWidth={150} /> : IMP}
          </div>
          <div className="card">
            <h3>Detalle por persona</h3>
            <Table
              head={["Persona", "Pubs", "Cumpl.", "Etiqueta", "Vistas/pub", "Tasa"]}
              align={["l", "r", "r", "r", "r", "r"]}
              rows={m.personas.map((p) => [p.name, int(p.pubs), pct(p.cumplimiento), pct(p.etiquetan), int(p.vistasPorPub), pct(p.tasa, 1)])}
            />
            <p className="note">Etiqueta = porcentaje de sus publicaciones que etiquetan a Dapper Global.</p>
          </div>
        </div>
      </Section>

      <Section title="Qué funciona" sub={`Compara con la tasa de interacción del programa (${pct(a.tasaPrograma, 1)}) y con ${int(a.vistasPrograma)} vistas por publicación. La tasa compara mejor que las vistas porque no depende del tamaño de la red de cada persona.`}>
        <div className="grid g2">{a.dims.map((d) => <DimCard key={d.titulo} d={d} minimo={a.minimo} />)}</div>
      </Section>

      <Section title="Quién publica mejor y cuándo" sub="Mejor franja horaria de cada persona según su tasa de interacción, y crecimiento de su red.">
        <div className="grid g2">
          <div className="card">
            <h3>Mejor franja por persona</h3>
            <Table head={["Persona", "Mejor franja"]} rows={a.mejorFranja.map((x) => [x.persona, x.franja])} />
          </div>
          <div className="card">
            <h3>Crecimiento de la red</h3>
            <Table
              head={["Persona", "Seg. inicial", "Último", "Crec.", "Seg. ganados"]}
              align={["l", "r", "r", "r", "r"]}
              rows={a.red.map((x) => {
                const last = [x.seg3, x.seg2, x.seg1].find((v) => v !== null) ?? null;
                return [x.persona, int(x.seg0), int(last), pct(x.crecimiento, 1), int(x.seguidoresGanados)];
              })}
            />
          </div>
        </div>
      </Section>

      <Section title="Las mejores publicaciones">
        <div className="grid g2">
          {[{ t: "Top 5 por vistas", r: a.topVistas }, { t: "Top 5 por tasa de interacción", r: a.topTasa }].map((x) => (
            <div className="card" key={x.t}>
              <h3>{x.t}</h3>
              {x.r.length === 0 ? <p className="empty" style={{ padding: 0 }}>Aún no hay publicaciones con métricas.</p> : (
                <Table
                  head={["#", "Responsable", "Tema", "Vistas", "Tasa"]}
                  align={["l", "l", "l", "r", "r"]}
                  rows={x.r.map((p) => [p.n, p.responsable, p.enlace ? <a key="e" href={p.enlace} target="_blank" rel="noreferrer">{p.tema || "Ver publicación"}</a> : p.tema, int(p.vistas), pct(p.tasa, 1)])}
                />
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Canales de Marketing" sub="Lo que hizo y logró cada canal de Dapper, mes a mes, frente al promedio de antes de la campaña.">
        <div className="card">
          <Table
            head={["Canal", "Mes", "Lo que hicimos", "Lo que logramos", "Cambio", "Vs. antes"]}
            align={["l", "l", "l", "l", "r", "r"]}
            rows={m.canales.resumen.map((r) => [
              r.canal, r.mes ? monthLabel(r.mes) : <span key="m" className="muted">{r.mesTexto || NA}</span>,
              r.hechoLabel ? `${r.hechoLabel}: ${int(r.hechoValor)}` : NA,
              r.logroLabel ? `${r.logroLabel}: ${int(r.logroValor)}` : NA,
              sgn(r.cambio), sgn(r.vsAntes),
            ])}
          />
        </div>
        <div className="grid g2" style={{ marginTop: 16 }}>{m.canales.detalle.map((c) => <CanalChart key={c.key} c={c} />)}</div>
      </Section>
    </>
  );
}
