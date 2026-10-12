import type { M1Data } from "@/lib/types";
import { dateLabel, dec, int, pct, times, usd, usdFull } from "@/lib/format";
import { Kpi, ProgressBar, Section, SplitBar, StatusPill, Table, alertStatus } from "@/components/ui";
import { ScenarioChart } from "@/components/charts/Charts";

export function M1View({ m }: { m: M1Data }) {
  const [fls, org, paeSin, paeCon, paeNo] = m.composicion;
  const escenarios = m.escenarios.filter((e) => e.arrProyectado !== null);
  return (
    <>
      <div className="grid g6 kpis">
        <Kpi label="ARR actual" value={usd(m.arrActual)} sub={`${int(m.contratosActivos)} contratos activos`} accent />
        <Kpi label="Meta de ARR" value={usd(m.meta)} />
        <Kpi label="Avance" value={pct(m.pctAvance, 1)} />
        <Kpi label="Brecha por cerrar" value={usd(m.brecha)} />
        <Kpi label="ARR nuevo por semana" value={usd(m.arrPorSemana)} sub="para llegar a la meta" />
        <Kpi label="Días al corte" value={int(m.diasRestantes)} sub={dateLabel(m.fechaCorte)} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <ProgressBar value={m.pctAvance} large left={`${usdFull(m.arrActual)} de ARR`} right={`Meta ${usdFull(m.meta)}`} />
      </div>

      <Section title="De dónde viene el ARR" sub="Composición del ARR actual por origen de la relación y por presencia de PAE.">
        <div className="grid g2">
          <div className="card">
            <h3>Por origen</h3>
            <p className="sub">Founder Led Sales frente a ventas orgánicas</p>
            <SplitBar
              format={usd}
              parts={[
                { label: "Founder Led", value: fls?.arr ?? null, color: "var(--accent)" },
                { label: "Orgánico", value: org?.arr ?? null, color: "var(--accent-lighter)" },
              ]}
            />
          </div>
          <div className="card">
            <h3>Por PAE</h3>
            <p className="sub">Contratos con y sin Public Affairs Engineer</p>
            <SplitBar
              format={usd}
              parts={[
                { label: "Con PAE", value: paeCon?.arr ?? null, color: "var(--accent)" },
                { label: "Sin PAE", value: paeNo?.arr ?? null, color: "var(--accent-light)" },
                { label: "Sin dato", value: paeSin?.arr ?? null, color: "var(--gray-light)" },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title="Concentración y renovaciones" sub="Qué tan repartido está el ARR y cuánto vence antes del corte.">
        <div className="grid g4 kpis">
          <Kpi label="Contrato más grande" value={pct(m.contratoMayorPct)} sub="del ARR actual" />
          <Kpi label="Tres contratos más grandes" value={pct(m.top3Pct)} sub="del ARR actual" />
          <Kpi label="ARR que vence antes del corte" value={usd(m.arrVence)} sub={`${pct(m.arrVencePct)} del ARR actual`} />
          <Kpi label="Contratos activos" value={int(m.contratosActivos)} />
        </div>
      </Section>

      <Section title="Pipeline en negociación" sub="Deals que aún no se firman, ordenados por ARR.">
        <div className="grid g4 kpis">
          <Kpi label="Deals en negociación" value={int(m.pipeline.deals)} />
          <Kpi label="ARR en negociación" value={usd(m.pipeline.arr)} />
          <Kpi label="Cobertura de la brecha" value={times(m.pipeline.cobertura, 2)} sub="pipeline sobre brecha" accent />
          <Kpi label="Deals con alerta" value={int(m.pipeline.alertas)} />
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <Table
            head={["Cliente", "Origen", "ARR", "PAE", "Estado legal", "Cierre estimado", "Último update", "Alerta"]}
            min={820}
            align={["l", "l", "r", "l", "l", "l", "l", "l"]}
            rows={m.deals.map((x) => [
              <div key="c"><b>{x.cliente}</b><div className="muted" style={{ fontSize: 12 }}>{x.rep}</div></div>,
              x.origen === "Founder Led Sales" ? "Founder Led" : x.origen === "Organic Sale" ? "Orgánico" : x.origen || "—",
              usd(x.arr),
              x.pae || "—",
              x.legal || "—",
              dateLabel(x.fechaCierre, false),
              <div key="u"><div>{dateLabel(x.ultimoUpdate, false)}</div><div className="muted" style={{ fontSize: 12, maxWidth: 260 }}>{x.comentario}</div></div>,
              <StatusPill key="a" status={alertStatus(x.alerta)} label={x.alerta || "—"} />,
            ])}
          />
        </div>
        {m.pipeline.fechasRevisar ? <p className="note">Hay {int(m.pipeline.fechasRevisar)} filas con fechas por revisar en el Sheet.</p> : null}
      </Section>

      <Section title="Escenarios" sub="ARR proyectado si se cierran los deals de cada escenario, frente a la meta.">
        {escenarios.length === 0 ? (
          <div className="card"><p className="empty">Aún no hay escenarios definidos en la hoja M1 Cálculos.</p></div>
        ) : (
          <div className="grid">
            <div className="card">
              <ScenarioChart data={escenarios.map((e) => ({ name: e.nombre, value: e.arrProyectado ?? 0 }))} meta={m.meta} />
            </div>
            <div className="card">
              <Table
                head={["Escenario", "Deals incluidos", "Proyectado", "Brecha"]}
                align={["l", "r", "r", "r"]}
                rows={escenarios.map((e) => [e.nombre, usd(e.arrDeals), usd(e.arrProyectado), (e.brecha ?? 0) === 0 ? <StatusPill key="b" status="ok" label="Cumple" /> : usd(e.brecha)])}
              />
              <p className="note">Renovaciones: el ARR proyectado descuenta el ARR que vence y no se renueva, según el porcentaje de cada escenario.</p>
            </div>
          </div>
        )}
      </Section>

      <Section title="Deals grandes como referencia" sub="Cuántos contratos como cada uno harían falta para cerrar la brecha actual.">
        <div className="card">
          <Table
            head={["Deal", "ARR", "PAE", "Cuántos harían falta"]}
            align={["l", "r", "l", "r"]}
            rows={m.grandes.map((g) => [g.deal, usd(g.arr), g.pae || "—", g.cuantos === null ? "—" : `${dec(g.cuantos)} (${int(g.redondeado)})`])}
          />
        </div>
      </Section>
    </>
  );
}
