/* eslint-disable @next/next/no-img-element */
import { CalendarDays, MapPin, Wallet } from "lucide-react";
import { buscarCategoria } from "@/lib/categorias";
import { STATUS_PEDIDO, formatarData, formatarReais, resumoServico } from "@/lib/pedidos";
import { IconeCategoria } from "./IconeCategoria";
import type { ResumoPedido } from "./CartaoPedido";

export function DetalhePedido({ p, fotos, extra }: { p: ResumoPedido; fotos: string[]; extra?: React.ReactNode }) {
  const status = p.status ? STATUS_PEDIDO[p.status] : null;
  return (
    <article className="space-y-4">
      <header className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-marca-clara text-marca">
          <IconeCategoria slug={p.categoria_slug} className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold leading-tight">{buscarCategoria(p.categoria_slug)?.nome}</h1>
          {p.ac_tipo_servico && <p className="text-sm font-medium text-marca">{resumoServico(p)}</p>}
        </div>
        {status && <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${status.cor}`}>{status.rotulo}</span>}
      </header>

      {fotos.length > 0 && (
        <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4">
          {fotos.map((url, i) => (
            <li key={i} className="shrink-0 snap-center">
              <a href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={`Foto ${i + 1} do pedido`} className="h-56 w-56 rounded-2xl object-cover" />
              </a>
            </li>
          ))}
        </ul>
      )}

      <section className="cartao space-y-3">
        <p className="whitespace-pre-line text-[15px] leading-relaxed">{p.descricao}</p>
        <ul className="space-y-1 text-sm">
          <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-marca" aria-hidden /> {p.bairro}, Teresina</li>
          <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-marca" aria-hidden /> {formatarData(p.data_desejada)}</li>
          <li className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-marca" aria-hidden />
            {p.lance_inicial != null ? <>Lance do cliente: <strong>{formatarReais(p.lance_inicial)}</strong></> : "Sem lance inicial: aguardando propostas"}
          </li>
        </ul>
      </section>
      {extra}
    </article>
  );
}
