import type { M2Cmp, M2Data, Num } from "@/lib/types";
import { dec, int, pct, times, usd } from "@/lib/format";
import { Kpi, Section, StatusPill, Table, alertStatus } from "@/components/ui";
import type { ReactNode } from "react";

function VsRow({ name, a, b, la, lb, fmt, extra }: { name: string; a: Num; b: Num; la: string; lb: string; fmt: (n: Num) => string; extra?: ReactNode }) {
  const max = Math.max(a ?? 0, b ?? 0, 0.0001);
  const w = (v: Num) => `${Math.max(2, ((v ?? 0) / max) * 100)}%`;
  return (
    <div className="vsrow">
      <div className="name">{name}{extra}</div>
      <div className="vsline">
        <span className="who">{la}</span>
        <div className="bar"><i style={{ left: 0, width: a === null ? "0%" : w(a) }} /></div>
        <span className="val">{fmt(a)}</span>
      </div>
      <div className="vsline">
        <span className="who">{lb}</span>
        <div className="bar"><i style={{ left: 0, width: b === null ? "0%" : w(b), background: "var(--accent-light)" }} /></div>
        <span className="val">{fmt(b)}</span>
      </div>
    </div>
  );
}

function Compare({ title, sub, la, lb, c, extraNote }: { title: string; sub: string; la: string; lb: string; c: M2Cmp; extraNote?: string }) {
  const ratioChip = (r: Num) => (r === null ? null : <span className="ratio">{times(r)}</span>);
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="sub">{sub}</p>
      <VsRow name="Contratos firmados" a={c.firmados[0]} b={c.firmados[1]} la={la} lb={lb} fmt={int} />
      <VsRow name="ARR total" a={c.arrTotal[0]} b={c.arrTotal[1]} la={la} lb={lb} fmt={usd} />
      <VsRow name="ARR promedio por contrato" a={c.arrProm[0]} b={c.arrProm[1]} la={la} lb={lb} fmt={usd} extra={ratioChip(c.ratio)} />
      <VsRow name="Tasa de cierre (firmados sobre firmados y perdidos)" a={c.tasaCierre[0]} b={c.tasaCierre[1]} la={la} lb={lb} fmt={(n) => pct(n)} extra={ratioChip(c.tasaRatio)} />
      <VsRow name="Deals en negociación hoy" a={c.negociacion[0]} b={c.negociacion[1]} la={la} lb={lb} fmt={int} />
      {extraNote ? <p className="note">{extraNote}</p> : null}
    </div>
  );
}

export function M2View({ m }: { m: M2Data }) {
  return (
    <>
      <Section title="Validación comercial" sub="Qué tanto más vale un contrato con PAE, o uno que viene de Luis Alberto, frente a los demás. El factor en morado es cuántas veces es mayor el primero que el segundo.">
        <div className="grid g2">
          <Compare title="Con PAE frente a sin PAE" sub="Contratos firmados, activos y finalizados" la="Con PAE" lb="Sin PAE" c={m.pae}
            extraNote={m.pae.sinDato ? `Hay ${int(m.pae.sinDato)} contratos sin dato de PAE: las comparaciones mejoran cuando comercial los complete.` : undefined} />
          <Compare title="Founder Led frente a orgánico" sub="Según quién consiguió la relación" la="Founder" lb="Orgánico" c={m.founder}
            extraNote="La tasa de cierre solo es confiable si los deals perdidos se marcan en la hoja M1 ARR." />
        </div>
      </Section>

      <Section title="Operación de los PAE" sub="Cómo arrancan y qué entregan los Public Affairs Engineers asignados a un cliente.">
        <div className="grid g6 kpis">
          <Kpi label="PAE con empresa asignada" value={int(m.ops.asignados)} accent />
          <Kpi label="Días de contrato a primer plan de trabajo" value={dec(m.ops.diasPlan)} sub="promedio" />
          <Kpi label="Días de contrato a primer entregable" value={dec(m.ops.diasEntregable)} sub="promedio" />
          <Kpi label="Proyectos entregados" value={int(m.ops.proyectos)} sub={`${dec(m.ops.proyectosMes, 2)} por mes en promedio`} />
          <Kpi label="Días de plan a primer entregable" value={dec(m.ops.diasPlanEntregable)} sub="promedio" />
          <Kpi label="Calificación del cliente (1 a 5)" value={dec(m.ops.califPromedio)} sub={`${int(m.ops.necesitanCalif)} por calificar`} />
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <Table
            head={["PAE", "Empresa", "Etapa", "Días a plan", "Días a entregable", "Proyectos", "Calificación", "Alerta"]}
            min={820}
            align={["l", "l", "l", "r", "r", "r", "r", "l"]}
            rows={m.filas.map((f) => [
              f.pae || <span key="p" className="muted">Sin asignar</span>,
              f.empresa, f.etapa || "—", int(f.diasPlan), int(f.diasEntregable), int(f.proyectos), dec(f.califPromedio),
              <StatusPill key="a" status={alertStatus(f.alerta)} label={f.alerta || "—"} />,
            ])}
          />
        </div>
      </Section>
    </>
  );
}
