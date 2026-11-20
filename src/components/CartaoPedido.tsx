/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CalendarDays, Camera, MapPin } from "lucide-react";
import { buscarCategoria } from "@/lib/categorias";
import { STATUS_PEDIDO, formatarData, formatarReais, resumoServico } from "@/lib/pedidos";
import { formatarDistancia } from "@/lib/geo";
import { IconeCategoria } from "./IconeCategoria";

export type ResumoPedido = {
  id: string;
  categoria_slug: string;
  ac_tipo_servico: string | null;
  ac_btus: number | null;
  ac_quantidade: number | null;
  descricao: string;
  bairro: string;
  data_desejada: string;
  lance_inicial: number | null;
  status?: string;
  total_fotos?: number;
  distancia_km?: number | null;
  dentro_do_raio?: boolean;
  capa?: string | null;
};

export function CartaoPedido({ p, href, mostrarStatus = false }: { p: ResumoPedido; href: string; mostrarStatus?: boolean }) {
  const status = p.status ? STATUS_PEDIDO[p.status] : null;
  return (
    <Link href={href} className={`cartao flex gap-3 transition hover:border-marca ${p.dentro_do_raio === false ? "opacity-75" : ""}`}>
      {p.capa ? (
        <img src={p.capa} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />
      ) : (
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-marca-clara text-marca">
          <IconeCategoria slug={p.categoria_slug} className="h-8 w-8" />
        </span>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold leading-tight">{buscarCategoria(p.categoria_slug)?.nome}</p>
          {p.lance_inicial != null && <span className="shrink-0 text-sm font-bold text-acao">{formatarReais(p.lance_inicial)}</span>}
        </div>
        {p.ac_tipo_servico && <p className="text-xs font-medium text-marca">{resumoServico(p)}</p>}
        <p className="line-clamp-2 text-sm text-suave">{p.descricao}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-suave">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{p.bairro}{p.distancia_km != null && ` · ${formatarDistancia(Number(p.distancia_km))}`}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" aria-hidden />{formatarData(p.data_desejada)}</span>
          {p.total_fotos ? <span className="inline-flex items-center gap-1"><Camera className="h-3.5 w-3.5" aria-hidden />{p.total_fotos}</span> : null}
        </p>
        {mostrarStatus && status && <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${status.cor}`}>{status.rotulo}</span>}
        {p.dentro_do_raio === false && <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-suave">Fora do seu raio</span>}
      </div>
    </Link>
  );
}
