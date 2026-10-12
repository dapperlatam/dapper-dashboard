import type { M4Data, Num } from "@/lib/types";
import { dateLabel, dec, int, pct } from "@/lib/format";
import { Kpi, ProgressBar, Section, SplitBar, Table } from "@/components/ui";
import { HBarChart } from "@/components/charts/Charts";

const n = (v: Num) => v ?? 0;

export function M4View({ m }: { m: M4Data }) {
  const d = m.deckDR;
  const comp = [
    { name: "Deck", i: 0 },
    { name: "Data room", i: 1 },
  ] as const;
  const man = m.manuales;
  return (
    <>
      <div className="grid g4 kpis">
        <Kpi label="Avance total deck y data room" value={pct(d.avanceTotal[2])} accent />
        <Kpi label="Tareas vencidas" value={int(d.vencidas[2])} sub={`${int(d.vencenPronto[2])} vencen en 7 días`} />
        <Kpi label="Manuales entregados" value={`${int(man.entregados)} / ${int(man.plan)}`} sub={`${int(man.enVigor)} en vigor`} />
        <Kpi label="Manuales vencidos" value={int(man.vencidos)} sub={`${int(man.sinImplementar)} sin implementar`} />
      </div>

      <Section title="Deck y data room" sub="El tono suave de la barra es el avance que ya existía antes de las tareas; el tono fuerte es lo que suman las tareas hechas.">
        <div className="grid g2">
          {comp.map(({ name, i }) => (
            <div className="card" key={name}>
              <h3>{name}</h3>
              <p className="sub">Próxima entrega pendiente: {dateLabel(d.proxima[i])}</p>
              <ProgressBar value={d.avanceTotal[i]} base={d.base[i]} large left={`Avance base ${pct(d.base[i])}`} right={`Total ${pct(d.avanceTotal[i])}`} />
              <div style={{ height: 16 }} />
              <SplitBar
                parts={[
                  { label: "Hechas", value: d.hechas[i], color: "var(--accent)" },
                  { label: "En revisión", value: d.enRevision[i], color: "var(--accent-light)" },
                  { label: "En curso", value: d.enCurso[i], color: "var(--accent-lighter)" },
                  { label: "Por hacer", value: d.porHacer[i], color: "var(--gray-light)" },
                  { label: "Bloqueadas", value: d.bloqueadas[i], color: "var(--gray)" },
                ]}
              />
              <p className="note">{int(d.tareas[i])} tareas cargadas · {int(d.vencidas[i])} vencidas</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Manuales de procesos" sub="Entregado es un manual terminado; en vigor es uno que ya se implementa en el proceso.">
        <div className="grid g2">
          <div className="card">
            <h3>Estado de los manuales</h3>
            <p className="sub">{pct(man.pctEntregado)} entregados · {pct(man.pctEnVigor)} en vigor</p>
            <SplitBar
              parts={[
                { label: "En vigor", value: man.enVigor, color: "var(--accent)" },
                { label: "Entregados sin implementar", value: man.sinImplementar, color: "var(--accent-light)" },
                { label: "En revisión", value: man.enRevision, color: "var(--accent-lighter)" },
                { label: "En elaboración", value: man.enElaboracion, color: "var(--gray-light)" },
                { label: "Por hacer", value: man.porHacer, color: "var(--gray)" },
              ]}
            />
            <div style={{ height: 14 }} />
            <Table
              head={["Tiempos", "Días"]}
              align={["l", "r"]}
              rows={[
                ["Elaboración (inicio a entrega real)", dec(man.diasElaboracion)],
                ["Frente a la fecha de referencia (+ = tarde)", dec(man.diasVsReferencia)],
                ["Entrega a entrada en vigor", dec(man.diasEntregaVigor)],
              ]}
            />
            <p className="note">{pct(man.pctLinear)} de los manuales tienen código de Linear.</p>
          </div>
          <div className="card">
            <h3>Por área</h3>
            <Table
              head={["Área", "Total", "Entregados", "Por entregar", "% entregado"]}
              align={["l", "r", "r", "r", "r"]}
              rows={m.porArea.filter((a) => n(a.total) > 0 || a.area !== "Sin área").map((a) => [a.area, int(a.total), int(a.hechos), int(a.porEntregar), pct(a.pct)])}
            />
          </div>
        </div>
      </Section>

      <Section title="Quién tiene qué pendiente" sub={m.mayorCarga.persona && m.mayorCarga.persona !== "Sin pendientes" ? `Mayor carga en deck y data room: ${m.mayorCarga.persona} (${int(m.mayorCarga.n)} tareas).` : "Tareas del deck y data room, y manuales por entregar o implementar."}>
        <div className="grid g2">
          <div className="card">
            <h3>Tareas pendientes de deck y data room</h3>
            <HBarChart
              data={m.carga.filter((c) => n(c.pendientes) > 0 || n(c.vencidas) > 0).map((c) => ({ name: c.persona, pendientes: n(c.pendientes), vencidas: n(c.vencidas) }))}
              series={[{ key: "pendientes", name: "Pendientes", color: "var(--accent)" }, { key: "vencidas", name: "Vencidas", color: "var(--gray)" }]}
              labelWidth={140}
              rowHeight={28}
            />
          </div>
          <div className="card">
            <h3>Detalle por persona</h3>
            <Table
              head={["Persona", "Tareas", "Vencidas", "Manuales por entregar", "Por implementar"]}
              align={["l", "r", "r", "r", "r"]}
              rows={m.carga.filter((c) => n(c.pendientes) + n(c.vencidas) + n(c.manualesPorEntregar) + n(c.manualesSinImplementar) > 0)
                .map((c) => [c.persona, int(c.pendientes), int(c.vencidas), int(c.manualesPorEntregar), int(c.manualesSinImplementar)])}
            />
          </div>
        </div>
      </Section>
    </>
  );
}
