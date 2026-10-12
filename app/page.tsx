import Link from "next/link";
import { getDashboard } from "@/lib/data";
import { METAS, statusFor } from "@/lib/status";
import { dateLabel, dec, int, pct, times, usd } from "@/lib/format";
import { Banners, Kpi, PageHead, ProgressBar, StatusPill, Updated } from "@/components/ui";
import { UpdatesPanel } from "@/components/UpdatesPanel";
import type { DashboardData } from "@/lib/types";

export const revalidate = 300;

type Card = { hero: string; heroLabel: string; progress: number | null; stats: { v: string; l: string }[] };

function cardFor(id: number, d: DashboardData): Card {
  if (id === 1 && d.m1) {
    const m = d.m1;
    return {
      hero: usd(m.arrActual), heroLabel: `de ${usd(m.meta)} de ARR (${pct(m.pctAvance, 1)})`, progress: m.pctAvance,
      stats: [{ v: usd(m.brecha), l: "Brecha por cerrar" }, { v: usd(m.pipeline.arr), l: "En negociación" }, { v: int(m.diasRestantes), l: "Días al corte" }],
    };
  }
  if (id === 2 && d.m2) {
    const m = d.m2;
    return {
      hero: times(m.founder.ratio), heroLabel: "ARR promedio de Founder Led frente a Orgánico", progress: null,
      stats: [{ v: pct(m.founder.pctPrimero), l: "Contratos Founder Led" }, { v: times(m.pae.ratio), l: "ARR con PAE vs sin PAE" }, { v: dec(m.ops.califPromedio), l: "Calificación PAE (1 a 5)" }],
    };
  }
  if (id === 3 && d.m3) {
    const m = d.m3;
    const vinc = (m.vinculados.pae ?? 0) + (m.vinculados.cto ?? 0);
    const meta = (m.meta.pae ?? 0) + (m.meta.cto ?? 0);
    return {
      hero: int(vinc), heroLabel: meta > 0 ? `vinculados de ${meta} previstos (PAE y CTO)` : "vinculados (PAE y CTO), sin meta definida", progress: meta > 0 ? vinc / meta : null,
      stats: [{ v: int((m.candidatos.pae ?? 0) + (m.candidatos.cto ?? 0)), l: "Candidatos" }, { v: int((m.operacion.reunionesProx7.pae ?? 0) + (m.operacion.reunionesProx7.cto ?? 0)), l: "Reuniones en 7 días" }, { v: int((m.operacion.conAlerta.pae ?? 0) + (m.operacion.conAlerta.cto ?? 0)), l: "Con alerta" }],
    };
  }
  if (id === 4 && d.m4) {
    const m = d.m4;
    return {
      hero: pct(m.deckDR.avanceTotal[2]), heroLabel: "avance del deck y el data room", progress: m.deckDR.avanceTotal[2],
      stats: [{ v: `${int(m.manuales.entregados)} / ${int(m.manuales.plan)}`, l: "Manuales entregados" }, { v: int(m.deckDR.vencidas[2]), l: "Tareas vencidas" }, { v: int(m.manuales.enVigor), l: "Manuales en vigor" }],
    };
  }
  if (id === 5 && d.m5) {
    const m = d.m5.resumen;
    return {
      hero: int(m.pubs), heroLabel: "publicaciones hechas", progress: null,
      stats: [{ v: int(m.vistas), l: "Vistas" }, { v: dec(m.interaccionesPorPub), l: "Interacciones por pub." }, { v: pct(m.aTiempo), l: "A tiempo" }],
    };
  }
  return { hero: "—", heroLabel: "Sin datos", progress: null, stats: [{ v: "—", l: "" }, { v: "—", l: "" }, { v: "—", l: "" }] };
}

export default async function Home() {
  const d = await getDashboard();
  const rows = METAS.map((m) => ({ m, s: statusFor(m.id, d), c: cardFor(m.id, d) }));
  const count = (st: string) => rows.filter((r) => r.s.status === st).length;
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
        <Kpi label="Metas sin update esta semana" value={d.updates ? `${d.updates.current.filter((c) => !c.done).length} de 5` : "—"} accent />
        <Kpi label="Metas en verde" value={count("ok")} />
        <Kpi label="Metas en ámbar" value={count("warn")} />
        <Kpi label="Metas en rojo" value={count("bad")} />
      </div>

      {d.updates ? (
        <>
          <h2 className="sec">Updates semanales</h2>
          <UpdatesPanel u={d.updates} />
        </>
      ) : null}

      <h2 className="sec">Las cinco metas</h2>
      <div className="grid g3">
        {rows.map(({ m, s, c }) => (
          <Link key={m.id} href={`/meta/${m.id}`} className="card mcard">
            <div className="mcard-top">
              <div>
                <div className="mnum">Meta {m.id}</div>
                <div className="mtitle">{m.short}</div>
                <div className="mowner">{m.owner}</div>
              </div>
              <StatusPill status={s.status} label={s.label} />
            </div>
            <div>
              <div className="hero">{c.hero}</div>
              <div className="hero-label">{c.heroLabel}</div>
            </div>
            {c.progress !== null ? <ProgressBar value={c.progress} /> : <div style={{ height: 10 }} />}
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
      <p className="footer">
        Los semáforos se calculan solos con los indicadores de cada Sheet (no se registran a mano). Toca una meta para ver su detalle y la regla de su semáforo.
      </p>
    </>
  );
}
