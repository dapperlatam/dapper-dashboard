import Link from "next/link";
import { getDashboard } from "@/lib/data";
import { METAS } from "@/lib/status";
import { dateLabel, dec, int, pct, times, usd } from "@/lib/format";
import { Banners, Kpi, PageHead, ProgressBar, StatusPill, Updated } from "@/components/ui";
import { UpdatesPanel } from "@/components/UpdatesPanel";
import type { DashboardData, Status } from "@/lib/types";

export const revalidate = 300;

type Hero = { hero: string; label: string; progress: number | null };
type Card = { badge: { status: Status; label: string }; heroes: Hero[]; stats: { v: string; l: string }[] };

const YES = { status: "ok" as Status, label: "Llegamos a la meta" };
const NOT_YET = { status: "neutral" as Status, label: "Aún no llegamos a la meta" };
const MONITOR = { status: "neutral" as Status, label: "En monitoreo" };
const EMPTY: Card = { badge: MONITOR, heroes: [{ hero: "—", label: "Sin datos", progress: null }], stats: [{ v: "—", l: "" }, { v: "—", l: "" }, { v: "—", l: "" }] };

function cardFor(id: number, d: DashboardData): Card {
  if (id === 1 && d.m1) {
    const m = d.m1;
    const reached = (m.meta ?? 0) > 0 && (m.arrActual ?? 0) >= (m.meta ?? 0);
    return {
      badge: reached ? YES : NOT_YET,
      heroes: [{ hero: usd(m.arrActual), label: `de ${usd(m.meta)} de ARR (${pct(m.pctAvance, 1)})`, progress: m.pctAvance }],
      stats: [{ v: usd(m.brecha), l: "Brecha por cerrar" }, { v: usd(m.pipeline.arr), l: "En negociación" }, { v: int(m.diasRestantes), l: "Días al corte" }],
    };
  }
  if (id === 2 && d.m2) {
    const m = d.m2;
    return {
      badge: MONITOR,
      heroes: [{ hero: times(m.founder.ratio), label: "ARR promedio de Founder Led frente a Orgánico", progress: null }],
      stats: [{ v: pct(m.founder.pctPrimero), l: "Contratos Founder Led" }, { v: times(m.pae.ratio), l: "ARR con PAE vs sin PAE" }, { v: dec(m.ops.califPromedio), l: "Calificación PAE (1 a 5)" }],
    };
  }
  if (id === 3 && d.m3) {
    const m = d.m3;
    const meta = m.meta ?? 0;
    const blancos = m.completar.reduce((t, c) => t + (c.sinCalificacion ?? 0) + (c.sinComentario ?? 0) + (c.sinDecision ?? 0), 0);
    return {
      badge: meta > 0 ? ((m.aceptaron ?? 0) >= meta ? YES : NOT_YET) : MONITOR,
      heroes: [{ hero: meta > 0 ? `${int(m.aceptaron)} de ${int(meta)}` : int(m.aceptaron), label: meta > 0 ? "PAE que aceptaron la propuesta, frente a la meta de contratación" : "PAE que aceptaron la propuesta (sin meta definida)", progress: meta > 0 ? (m.aceptaron ?? 0) / meta : null }],
      stats: [{ v: int(m.candidatos), l: "Candidatos" }, { v: int(m.enProceso), l: "En proceso" }, { v: int(blancos), l: "Campos por completar" }],
    };
  }
  if (id === 4 && d.m4) {
    const m = d.m4;
    const av = m.deckDR.avanceTotal[2];
    const reached = (av ?? 0) >= 1 && (m.manuales.plan ?? 0) > 0 && (m.manuales.entregados ?? 0) >= (m.manuales.plan ?? 0);
    return {
      badge: reached ? YES : NOT_YET,
      heroes: [
        { hero: pct(av), label: "avance del deck y el data room (meta 100%)", progress: av },
        { hero: `${int(m.manuales.entregados)} de ${int(m.manuales.plan)}`, label: "manuales entregados (meta: todos)", progress: (m.manuales.plan ?? 0) > 0 ? (m.manuales.entregados ?? 0) / (m.manuales.plan ?? 1) : null },
      ],
      stats: [{ v: int(m.deckDR.vencidas[2]), l: "Tareas vencidas" }, { v: int(m.manuales.enVigor), l: "Manuales en vigor" }, { v: int(m.manuales.sinImplementar), l: "Entregados sin implementar" }],
    };
  }
  if (id === 5 && d.m5) {
    const m = d.m5;
    const cump = m.panel.find((p) => p.pregunta.startsWith("¿Cumple el equipo"));
    return {
      badge: MONITOR,
      heroes: [{ hero: int(m.control.pubs), label: "publicaciones de la campaña Voces Dapper", progress: null }],
      stats: [{ v: int(m.totales?.vistas ?? null), l: "Vistas" }, { v: pct(m.totales?.tasa ?? null, 1), l: "Tasa de interacción" }, { v: typeof cump?.valor === "number" ? pct(cump.valor) : "—", l: "Equipo que publicó" }],
    };
  }
  return EMPTY;
}

export default async function Home() {
  const d = await getDashboard();
  const rows = METAS.map((m) => ({ m, c: cardFor(m.id, d) }));
  const pend = d.updates ? d.updates.current.filter((c) => !c.done).length : null;
  return (
    <>
      <Banners d={d} />
      <PageHead
        eyebrow="Q4 2026 · Habilitantes para la ronda"
        title="Seguimiento de metas"
        lede="Cinco metas para llegar a la ronda de inversión con el negocio, el equipo y la historia en orden."
      >
        <div className="meta-row">
          <Updated d={d} />
          {d.m1?.fechaCorte ? <span className="chip">Corte de la meta de ARR: {dateLabel(d.m1.fechaCorte)} ({int(d.m1.diasRestantes)} días)</span> : null}
        </div>
      </PageHead>

      <div className="grid g4 kpis">
        <Kpi label="Updates pendientes esta semana" value={d.updates && pend !== null ? `${pend} de ${d.updates.current.length}` : "—"} accent />
        <Kpi label="Días al corte de ARR" value={int(d.m1?.diasRestantes ?? null)} />
        <Kpi label="ARR actual" value={usd(d.m1?.arrActual ?? null)} sub={`de ${usd(d.m1?.meta ?? null)}`} />
        <Kpi label="ARR por cerrar" value={usd(d.m1?.brecha ?? null)} />
      </div>

      {d.updates ? (
        <>
          <h2 className="sec">Updates semanales</h2>
          <UpdatesPanel u={d.updates} />
        </>
      ) : null}

      <h2 className="sec">Las cinco metas</h2>
      <div className="grid g3">
        {rows.map(({ m, c }) => (
          <Link key={m.id} href={`/meta/${m.id}`} className="card mcard">
            <div className="mcard-top">
              <div>
                <div className="mnum">Meta {m.id}</div>
                <div className="mtitle">{m.short}</div>
                <div className="mowner">{m.owner}</div>
              </div>
              <StatusPill status={c.badge.status} label={c.badge.label} />
            </div>
            <div style={c.heroes.length > 1 ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } : undefined}>
              {c.heroes.map((h, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                  <div>
                    <div className="hero" style={c.heroes.length > 1 ? { fontSize: 30 } : undefined}>{h.hero}</div>
                    <div className="hero-label">{h.label}</div>
                  </div>
                  {h.progress !== null ? <ProgressBar value={h.progress} /> : <div style={{ height: 10 }} />}
                </div>
              ))}
            </div>
            <div className="mini">
              {c.stats.map((x, i) => (
                <div key={i}>
                  <div className="v">{x.v}</div>
                  <div className="l">{x.l}</div>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
      <p className="footer">Toca una meta para ver su detalle. Las metas 2 y 5 están en monitoreo porque todavía no tienen una meta numérica.</p>
    </>
  );
}
