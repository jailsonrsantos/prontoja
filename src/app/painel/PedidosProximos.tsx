"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { List, Map as IconeMapa } from "lucide-react";
import { Mapa, type MarcadorMapa } from "@/components/mapa/Mapa";
import { CartaoPedido, type ResumoPedido } from "@/components/CartaoPedido";
import { BotaoLocalizacao } from "@/components/BotaoLocalizacao";
import { buscarCategoria } from "@/lib/categorias";
import { formatarDistancia } from "@/lib/geo";
import { formatarReais } from "@/lib/pedidos";
import type { MeuLocal } from "@/lib/meuLocal";

export type PedidoProximo = ResumoPedido & { area_lat: number; area_lng: number; cliente_nome: string };

const ORIGEM_TEXTO = { gps: "sua localização aproximada", bairro: "o centro do seu bairro", cidade: "o centro de Teresina" };

export function PedidosProximos({ pedidos, local, raioKm }: { pedidos: PedidoProximo[]; local: MeuLocal; raioKm: number }) {
  const router = useRouter();
  const [modo, setModo] = useState<"lista" | "mapa">("lista");

  const marcadores = useMemo<MarcadorMapa[]>(
    () =>
      pedidos.map((p) => ({
        id: p.id,
        lat: p.area_lat,
        lng: p.area_lng,
        tipo: "pedido",
        titulo: `${buscarCategoria(p.categoria_slug)?.nome ?? "Pedido"} · ${p.bairro}`,
        subtitulo: [formatarDistancia(Number(p.distancia_km)), p.lance_inicial != null ? `lance ${formatarReais(p.lance_inicial)}` : null]
          .filter(Boolean)
          .join(" · "),
        href: `/painel/pedido/${p.id}`,
        rotulo: p.lance_inicial != null ? "R$" : "•",
      })),
    [pedidos],
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-bold">Pedidos abertos perto de você</h2>
          <p className="text-xs text-suave">
            A partir de {ORIGEM_TEXTO[local.fonte]} · seu raio: {raioKm >= 50 ? "toda Teresina" : `${raioKm} km`}
          </p>
        </div>
        <div className="flex shrink-0 rounded-xl bg-slate-100 p-1" role="group" aria-label="Ver como">
          {(["lista", "mapa"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              aria-pressed={modo === m}
              className={`grid h-11 w-11 place-items-center rounded-lg ${modo === m ? "bg-white text-marca shadow" : "text-suave"}`}
              aria-label={m === "lista" ? "Lista" : "Mapa"}
            >
              {m === "lista" ? <List className="h-5 w-5" /> : <IconeMapa className="h-5 w-5" />}
            </button>
          ))}
        </div>
      </div>

      {local.fonte !== "gps" && <BotaoLocalizacao aoObter={() => router.refresh()} />}

      {modo === "mapa" && <Mapa centro={local} marcadores={marcadores} voce={local} />}

      {pedidos.length === 0 ? (
        <p className="cartao text-center text-sm text-suave">
          Nenhum pedido aberto nas suas categorias agora. Confira se marcou suas especialidades no currículo.
        </p>
      ) : (
        <ul className="space-y-3">
          {pedidos.map((p) => (
            <li key={p.id}>
              <CartaoPedido p={p} href={`/painel/pedido/${p.id}`} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
