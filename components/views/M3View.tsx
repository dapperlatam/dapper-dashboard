import type { M3Data } from "@/lib/types";
import { int, pct } from "@/lib/format";
import { Kpi, ProgressBar, Section, Table } from "@/components/ui";
import { HBarChart } from "@/components/charts/Charts";

export function M3View({ m }: { m: M3Data }) {
  const activos = m.embudo.filter((e) => e.etapa !== "Descartados");
  const descartados = m.embudo.filter((e) => e.etapa === "Descartados");
  const blancos = m.completar.reduce((t, c) => t + (c.sinCalificacion ?? 0) + (c.sinComentario ?? 0) + (c.sinDecision ?? 0), 0);
  const meta = m.meta ?? 0;
  return (
    <>
      <div className="grid g4 kpis">
        <Kpi label="Candidatos del proceso PAE" value={int(m.candidatos)} accent sub={`${int(m.enProceso)} en proceso`} />
        <Kpi label="Aceptaron la propuesta" value={int(m.aceptaron)} sub={meta > 0 ? `Meta: ${int(meta)}` : "Sin meta definida"} />
        <Kpi label="Descartados o declinaron" value={`${int(m.descartados)} · ${int(m.declinaron)}`} sub="descartados · declinaron" />
        <Kpi label="Campos por completar" value={int(blancos)} sub="en reuniones ya hechas" />
      </div>
      {meta > 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <ProgressBar value={(m.aceptaron ?? 0) / meta} large left={`${int(m.aceptaron)} aceptaron`} right={`Meta ${int(meta)}`} />
        </div>
      ) : null}

      <Section title="Dónde está cada candidato" sub="Embudo del PAE: cada candidato cuenta una sola vez, en el último paso que cumplió.">
        <div className="card">
          {activos.some((e) => (e.n ?? 0) > 0) ? (
            <HBarChart data={activos.map((e) => ({ name: e.paso, value: e.n ?? 0 }))} series={[{ key: "value", name: "Candidatos" }]} labelWidth={230} rowHeight={30} />
          ) : (
            <p className="empty">Aún no hay candidatos en el proceso.</p>
          )}
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Descartados por etapa</h3>
          <Table head={["Dónde se descartaron", "Candidatos"]} align={["l", "r"]} rows={descartados.map((e) => [e.paso.replace("Descartado: ", "").replace("Descartado ", ""), int(e.n)])} />
        </div>
      </Section>

      <Section title="Requisitos y pendientes">
        <div className="grid g2">
          <div className="card">
            <h3>Validación de requisitos</h3>
            <Table head={["Clasificación", "Candidatos"]} align={["l", "r"]} rows={m.validacion.map((v) => [v.label, int(v.n)])} />
          </div>
          <div className="card">
            <h3>Pendientes</h3>
            <Table head={["Tema", "Candidatos"]} align={["l", "r"]} rows={m.pendientes.map((p) => [p.label, int(p.n)])} />
          </div>
        </div>
      </Section>

      <Section title="Fuentes de candidatos">
        <div className="card">
          <Table
            head={["Fuente", "Candidatos", "Entrevistados con Cristian", "Aceptaron la propuesta"]}
            align={["l", "r", "r", "r"]}
            rows={m.fuentes.map((f) => [f.fuente, int(f.candidatos), int(f.entrevistados), int(f.aceptaron)])}
          />
        </div>
      </Section>

      <Section title="Datos por completar" sub="Reuniones o pruebas ya hechas con campos en blanco. Sirve para completar el histórico.">
        <div className="card">
          <Table
            head={["Etapa", "Hechas", "Sin calificación", "Sin comentario", "Sin decisión"]}
            align={["l", "r", "r", "r", "r"]}
            rows={m.completar.map((c) => [c.etapa, int(c.hechas), int(c.sinCalificacion), int(c.sinComentario), int(c.sinDecision)])}
          />
          <p className="note">{pct(m.candidatos ? (m.aceptaron ?? 0) / m.candidatos : null, 1)} de los candidatos ha aceptado la propuesta. Esta meta solo muestra datos agregados: no se leen nombres, salarios ni comentarios.</p>
        </div>
      </Section>
    </>
  );
}
