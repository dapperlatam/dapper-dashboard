import { METAS } from "@/lib/status";
import type { UpdateRow, UpdatesSummary } from "@/lib/types";
import { dateLabel, int } from "@/lib/format";
import { StatusPill, Table } from "@/components/ui";
import { HBarChart } from "@/components/charts/Charts";

const SYMBOL = { ok: "✓", miss: "✗", open: "·" } as const;

export function UpdatesPanel({ u }: { u: UpdatesSummary }) {
  const pending = u.current.filter((c) => !c.done);
  const when = u.daysLeft === 0 ? "vence hoy" : u.daysLeft === 1 ? "falta 1 día" : `faltan ${u.daysLeft} días`;
  const missedTotal = u.points.reduce((s, p) => s + p.points, 0);
  return (
    <>
      <div className="grid g2">
        <div className="card">
          <div className="weekbar">
            <b>Updates de esta semana</b>
            <span>Cierra el lunes {dateLabel(u.deadline, false)} a la medianoche ({when})</span>
          </div>
          {u.current.map((c) => {
            const m = METAS.find((x) => x.id === c.meta)!;
            return (
              <div className="urow" key={c.meta}>
                <div className="who">
                  <b>Meta {m.id} · {m.short}</b>
                  <div>{m.owner}</div>
                </div>
                {c.done ? (
                  <StatusPill status="ok" label="Entregado" />
                ) : u.daysLeft === 0 ? (
                  <StatusPill status="bad" label="Vence hoy" />
                ) : (
                  <StatusPill status={u.daysLeft <= 2 ? "warn" : "neutral"} label="Pendiente" />
                )}
              </div>
            );
          })}
          <p className="note">
            {pending.length === 0
              ? "Todas las metas tienen su update de la semana."
              : `Sin update todavía: ${pending.map((c) => `Meta ${c.meta}`).join(", ")}.`}
          </p>
        </div>

        <div className="card">
          <div className="weekbar">
            <b>Puntos de incumplimiento</b>
            <span>{u.started ? `Desde el lunes ${dateLabel(u.startDeadline, false)}` : `Empieza el lunes ${dateLabel(u.startDeadline)}`}</span>
          </div>
          {u.started ? (
            <>
              <HBarChart
                data={u.points.map((p) => ({ name: p.owner, puntos: p.points }))}
                series={[{ key: "puntos", name: "Puntos", color: "var(--accent)" }]}
                labelWidth={130}
                rowHeight={34}
              />
              <p className="note">
                {missedTotal === 0
                  ? "Nadie ha dejado de entregar su update semanal."
                  : `Cada meta sin update en una semana cerrada suma 1 punto a su encargado (${int(missedTotal)} en total).`}
              </p>
            </>
          ) : (
            <p className="empty">El conteo empieza con el cierre del lunes {dateLabel(u.startDeadline)}. Cada meta sin update esa semana suma 1 punto a su encargado.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="weekbar">
          <b>Historial semanal</b>
          <span>✓ entregado · ✗ sin update · · semana abierta</span>
        </div>
        <Table
          head={["Meta", ...u.weeks.map((w) => `Lun ${dateLabel(w, false)}`)]}
          align={["l", ...u.weeks.map(() => "r" as const)]}
          rows={METAS.map((m) => [
            <span key="n"><b>Meta {m.id}</b> <span className="muted">{m.owner}</span></span>,
            ...u.weeks.map((w) => <span key={w} className={`mx ${u.matrix[m.id][w]}`}>{SYMBOL[u.matrix[m.id][w]]}</span>),
          ])}
        />
      </div>
    </>
  );
}

export function LastUpdate({ row, owner }: { row: UpdateRow | null; owner: string }) {
  return (
    <div className="card lastupd" style={{ marginBottom: 8 }}>
      <h3>Último update</h3>
      {row ? (
        <>
          <div className="m">{dateLabel(row.fecha)} · {row.quien || owner}</div>
          <div className="t"><b>Qué avanzó:</b> {row.avance || "—"}</div>
          <div className="t"><b>Qué sigue o qué lo bloquea:</b> {row.sigue || "—"}</div>
        </>
      ) : (
        <p className="empty" style={{ padding: 0 }}>Aún no hay updates registrados para esta meta.</p>
      )}
    </div>
  );
}
