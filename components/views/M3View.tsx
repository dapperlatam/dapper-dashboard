import type { M3Data, M3Pair } from "@/lib/types";
import { dec, int, pct } from "@/lib/format";
import { Kpi, ProgressBar, Section, Table } from "@/components/ui";
import { HBarChart } from "@/components/charts/Charts";

const pairNum = (p: M3Pair) => `${int(p.pae)} · ${int(p.cto)}`;

export function M3View({ m }: { m: M3Data }) {
  const meta = (m.meta.pae ?? 0) + (m.meta.cto ?? 0);
  const vinc = (m.vinculados.pae ?? 0) + (m.vinculados.cto ?? 0);
  const embudo = (rows: M3Data["embudoPae"]) =>
    rows.map((r) => ({ name: r.etapa.replace(/^\d+\.\s*/, ""), registradas: r.registradas ?? 0, avanzan: r.avanzan ?? 0, noAvanzan: r.noAvanzan ?? 0 }));
  const ESTADO_SERIES = [
    { key: "pae", name: "PAE", color: "var(--accent)" },
    { key: "cto", name: "CTO", color: "var(--accent-lighter)" },
  ];
  return (
    <>
      <div className="grid g4 kpis">
        <Kpi label="Vinculados (PAE · CTO)" value={pairNum(m.vinculados)} accent sub={meta > 0 ? `Meta: ${int(m.meta.pae)} · ${int(m.meta.cto)}` : "Sin meta definida"} />
        <Kpi label="En vinculación (PAE · CTO)" value={pairNum(m.enVinculacion)} />
        <Kpi label="Candidatos (PAE · CTO)" value={pairNum(m.candidatos)} />
        <Kpi label="Reuniones en 7 días (PAE · CTO)" value={pairNum(m.operacion.reunionesProx7)} />
      </div>
      {meta > 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <ProgressBar value={vinc / meta} large left={`${vinc} vinculados`} right={`Previstos ${meta}`} />
        </div>
      ) : null}

      <Section title="Dónde está cada candidato" sub="Candidatos por estado del proceso, PAE y CTO.">
        <div className="card">
          <HBarChart data={m.estados.map((e) => ({ name: e.label, pae: e.pae ?? 0, cto: e.cto ?? 0 }))} series={ESTADO_SERIES} labelWidth={180} rowHeight={30} />
        </div>
      </Section>

      <Section title="Embudo por etapa" sub="Reuniones registradas en cada etapa y qué decidió el entrevistador.">
        <div className="grid g2">
          {[{ t: "PAE", r: m.embudoPae }, { t: "CTO", r: m.embudoCto }].map((x) => (
            <div className="card" key={x.t}>
              <h3>{x.t}</h3>
              <HBarChart
                data={embudo(x.r)}
                series={[
                  { key: "registradas", name: "Reuniones", color: "var(--accent-lighter)" },
                  { key: "avanzan", name: "Avanzan", color: "var(--accent)" },
                  { key: "noAvanzan", name: "No avanzan", color: "var(--gray)" },
                ]}
                labelWidth={130}
                rowHeight={30}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Validación y operación pendiente">
        <div className="grid g2">
          <div className="card">
            <h3>Validación de requisitos</h3>
            <Table head={["Clasificación", "PAE", "CTO"]} align={["l", "r", "r"]} rows={m.validacion.map((v) => [v.label, int(v.pae), int(v.cto)])} />
          </div>
          <div className="card">
            <h3>Pendientes</h3>
            <Table
              head={["Tema", "PAE", "CTO"]}
              align={["l", "r", "r"]}
              rows={[
                ["Reuniones realizadas sin decisión", int(m.operacion.sinDecision.pae), int(m.operacion.sinDecision.cto)],
                ["Sin calificación o comentario", int(m.operacion.sinCalificacion.pae), int(m.operacion.sinCalificacion.cto)],
                ["Candidatos con alerta", int(m.operacion.conAlerta.pae), int(m.operacion.conAlerta.cto)],
                ["Días promedio hasta el inicio (vinculados)", dec(m.tiempos.entradaAInicio.pae), dec(m.tiempos.entradaAInicio.cto)],
                ["Días promedio en proceso (activos)", dec(m.tiempos.activos.pae), dec(m.tiempos.activos.cto)],
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title="Fuentes y asignación">
        <div className="grid g2">
          <div className="card">
            <h3>Qué fuente trae candidatos</h3>
            <Table
              head={["Fuente", "PAE cand.", "PAE vinc.", "CTO cand.", "CTO vinc."]}
              align={["l", "r", "r", "r", "r"]}
              rows={m.fuentes.map((f) => [f.fuente, int(f.paeCand), int(f.paeVinc), int(f.ctoCand), int(f.ctoVinc)])}
            />
          </div>
          <div className="card">
            <h3>Evaluaciones pendientes por entrevistador</h3>
            <Table head={["Entrevistador", "PAE", "CTO"]} align={["l", "r", "r"]} rows={m.pendientesPorPersona.map((p) => [p.persona, int(p.pae), int(p.cto)])} />
            <p className="note">
              PAE vinculados: {int(m.paeAsignados.vinculados)} · con empresa asignada: {int(m.paeAsignados.conEmpresa)} · sin empresa: {int(m.paeAsignados.sinEmpresa)} ({pct(m.paeAsignados.vinculados ? (m.paeAsignados.conEmpresa ?? 0) / m.paeAsignados.vinculados : null)} asignados).
            </p>
          </div>
        </div>
      </Section>
      <p className="note">Esta meta solo muestra datos agregados: no se leen nombres de candidatos, salarios ni comentarios.</p>
    </>
  );
}
