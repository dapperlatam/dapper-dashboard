import type { M1Data } from "@/lib/types";
import { dateLabel, dec, int, pct, times, usd, usdFull } from "@/lib/format";
import { Kpi, ProgressBar, Section, SplitBar, StatusPill, Table, alertStatus } from "@/components/ui";
import { ColumnChart, HBarChart, ScenarioChart } from "@/components/charts/Charts";

const cap = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

function Desempeno({ d }: { d: NonNullable<M1Data["desempeno"]> }) {
  const mes = d.resumen.filter((r) => r.mes === d.mesEnCurso);
  const sum = (f: (r: (typeof mes)[number]) => number | null) => mes.reduce((a, r) => a + (f(r) ?? 0), 0);
  const faTot = sum((r) => r.fa);
  const metaTot = sum((r) => r.meta);
  const fuH = sum((r) => r.fuHechos);
  const fuP = sum((r) => r.fuPosibles);
  const conIdx = mes.filter((r) => r.indice !== null);
  const idxProm = conIdx.length ? conIdx.reduce((a, r) => a + (r.indice ?? 0), 0) / conIdx.length : null;
  const semanas = d.semanas.filter((w) => w.mes === d.mesEnCurso || (w.total ?? 0) > 0).map((w) => ({ name: `${cap(w.mes).slice(0, 3)} ${w.label.split("·")[0].trim()}`, fa: w.total ?? 0 }));
  return (
    <Section title={`Desempeño comercial: ${d.mesEnCurso}`} sub={`Índice conjunto = ${pct(d.pesoFA)} first approach frente a la meta + ${pct(d.pesoSeg)} seguimiento semanal a los deals en negociación.`}>
      <div className="grid g4 kpis">
        <Kpi label="First approach del mes" value={`${int(faTot)} / ${int(metaTot)}`} sub={metaTot > 0 ? `${pct(faTot / metaTot)} de la meta del equipo` : "Sin meta definida"} accent />
        <Kpi label="Seguimiento a deals" value={fuP > 0 ? pct(fuH / fuP) : "—"} sub={`${int(fuH)} de ${int(fuP)} seguimientos posibles`} />
        <Kpi label="Índice conjunto promedio" value={pct(idxProm)} />
        <Kpi label="Meta por comercial" value={int(d.metaFA)} sub="first approach en el mes" />
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Índice conjunto por comercial</h3>
          {mes.length ? <HBarChart data={mes.map((r) => ({ name: r.comercial, value: r.indice ?? 0 }))} series={[{ key: "value", name: "Índice" }]} format="pct" labelWidth={110} /> : <p className="empty">Sin datos todavía</p>}
        </div>
        <div className="card">
          <h3>First approach por semana (equipo)</h3>
          {semanas.some((w) => w.fa > 0) ? <ColumnChart data={semanas} xKey="name" series={[{ key: "fa", name: "First approach", color: "var(--accent)" }]} height={220} /> : <p className="empty">Aún no hay first approach registrados.</p>}
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Detalle por comercial</h3>
        <Table
          head={["Comercial", "First approach", "% de la meta", "Seguimientos", "% seguimiento", "Índice"]}
          align={["l", "r", "r", "r", "r", "r"]}
          rows={mes.map((r) => [r.comercial, `${int(r.fa)} / ${int(r.meta)}`, pct(r.pctMeta), `${int(r.fuHechos)} / ${int(r.fuPosibles)}`, pct(r.pctSeg), pct(r.indice)])}
        />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Seguimiento semanal a deals en negociación</h3>
        <p className="sub">✓ hubo seguimiento esa semana · · sin seguimiento.</p>
        <Table
          head={["Deal", "Comercial", ...(d.deals[0]?.flags.map((f) => f.label.split("·")[0].trim()) ?? []), `% ${d.mesEnCurso}`]}
          align={["l", "l", ...(d.deals[0]?.flags.map(() => "r" as const) ?? []), "r"]}
          rows={d.deals.map((x) => [x.cliente, x.comercial || <span key="c" className="muted">Sin asignar</span>, ...x.flags.map((f, i) => <span key={i} className={`mx ${f.v === 1 ? "ok" : "open"}`}>{f.v === 1 ? "✓" : "·"}</span>), pct(x.pctMes)])}
        />
      </div>
    </Section>
  );
}

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
            head={["Cliente", "Origen", "ARR", "PAE", "Estado legal", "Cierre estimado", "Último seguimiento", "Alerta"]}
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

      {m.desempeno ? <Desempeno d={m.desempeno} /> : null}

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
