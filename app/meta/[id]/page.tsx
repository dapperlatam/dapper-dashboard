import { notFound } from "next/navigation";
import { getDashboard } from "@/lib/data";
import { METAS, statusFor } from "@/lib/status";
import { Back, Banners, PageHead, StatusPill, Updated } from "@/components/ui";
import { LastUpdate } from "@/components/UpdatesPanel";
import { M1View } from "@/components/views/M1View";
import { M2View } from "@/components/views/M2View";
import { M3View } from "@/components/views/M3View";
import { M4View } from "@/components/views/M4View";
import { M5View } from "@/components/views/M5View";

export const revalidate = 300;

export function generateStaticParams() {
  return METAS.map((m) => ({ id: String(m.id) }));
}

export default async function MetaPage({ params }: { params: { id: string } }) {
  const meta = METAS.find((m) => String(m.id) === params.id);
  if (!meta) notFound();
  const d = await getDashboard();
  const st = statusFor(meta.id, d);
  return (
    <>
      <Back />
      <Banners d={d} />
      <PageHead eyebrow={`Meta ${meta.id}`} title={meta.title}>
        <div className="meta-row">
          <span className="chip">Encargado: {meta.owner}</span>
          <Updated d={d} />
        </div>
      </PageHead>
      {d.updates ? <LastUpdate row={d.updates.latest[meta.id]} owner={meta.owner} /> : null}
      {meta.id === 1 && (d.m1 ? <M1View m={d.m1} /> : <p className="empty">No hay datos de la meta 1.</p>)}
      {meta.id === 2 && (d.m2 ? <M2View m={d.m2} /> : <p className="empty">No hay datos de la meta 2.</p>)}
      {meta.id === 3 && (d.m3 ? <M3View m={d.m3} /> : <p className="empty">No hay datos de la meta 3.</p>)}
      {meta.id === 4 && (d.m4 ? <M4View m={d.m4} /> : <p className="empty">No hay datos de la meta 4.</p>)}
      {meta.id === 5 && (d.m5 ? <M5View m={d.m5} /> : <p className="empty">No hay datos de la meta 5.</p>)}
    </>
  );
}
