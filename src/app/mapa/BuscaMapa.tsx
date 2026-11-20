"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIAS, buscarCategoria } from "@/lib/categorias";
import { formatarDistancia, type Ponto } from "@/lib/geo";
import { urlPublica } from "@/lib/storage";
import type { MeuLocal } from "@/lib/meuLocal";
import { Mapa, type MarcadorMapa } from "@/components/mapa/Mapa";
import { Avatar } from "@/components/Avatar";
import { Nota, SeloVerificado } from "@/components/Selos";
import { BotaoLocalizacao } from "@/components/BotaoLocalizacao";

type ProfissionalProximo = {
  id: string;
  nome: string;
  foto_url: string | null;
  bairro: string | null;
  verificado: boolean;
  nota_media: number;
  total_avaliacoes: number;
  total_servicos: number;
  categorias: string[];
  raio_km: number;
  area_lat: number;
  area_lng: number;
  distancia_km: number;
};

const ORIGEM_TEXTO = { gps: "sua localização aproximada", bairro: "o centro do seu bairro", cidade: "o centro de Teresina" };

export function BuscaMapa({ categoriaInicial, localInicial }: { categoriaInicial: string | null; localInicial: MeuLocal }) {
  const [categoria, setCategoria] = useState<string | null>(categoriaInicial);
  const [origem, setOrigem] = useState<Ponto>(localInicial);
  const [fonte, setFonte] = useState(localInicial.fonte);
  const [lista, setLista] = useState<ProfissionalProximo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    setLista(null);
    createClient()
      .rpc("buscar_profissionais_proximos", { p_lat: origem.lat, p_lng: origem.lng, p_categoria: categoria })
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) setErro("Não foi possível carregar os profissionais. Tente de novo.");
        else setLista((data ?? []) as ProfissionalProximo[]);
      });
    return () => {
      ativo = false;
    };
  }, [origem, categoria]);

  const marcadores = useMemo<MarcadorMapa[]>(
    () =>
      (lista ?? []).map((p) => ({
        id: p.id,
        lat: p.area_lat,
        lng: p.area_lng,
        tipo: "profissional",
        titulo: p.nome,
        subtitulo: `${p.verificado ? "✔ Verificado · " : ""}${p.total_avaliacoes ? `★ ${Number(p.nota_media).toFixed(1).replace(".", ",")} · ` : ""}${formatarDistancia(Number(p.distancia_km))}`,
        href: `/profissional/${p.id}`,
        rotulo: p.nome.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase(),
        foto: urlPublica(p.foto_url),
      })),
    [lista],
  );

  const nomeCategoria = categoria ? buscarCategoria(categoria)?.nome : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marca">Profissionais perto de você</h1>
        <p className="text-sm text-suave">Distâncias a partir de {ORIGEM_TEXTO[fonte]}.</p>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtrar por categoria">
        {[{ slug: null, nome: "Todos" }, ...CATEGORIAS.filter((c) => c.ativa)].map((c) => (
          <button
            key={c.slug ?? "todos"}
            type="button"
            onClick={() => setCategoria(c.slug)}
            aria-pressed={categoria === c.slug}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${
              categoria === c.slug ? "border-marca bg-marca text-white" : "border-slate-300 bg-white text-texto"
            }`}
          >
            {c.nome}
          </button>
        ))}
      </div>

      <Mapa centro={origem} marcadores={marcadores} voce={origem} />

      {fonte !== "gps" && (
        <BotaoLocalizacao
          aoObter={(p) => {
            setOrigem(p);
            setFonte("gps");
          }}
        />
      )}

      {erro && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{erro}</p>}

      <section aria-live="polite" className="space-y-3">
        <h2 className="font-bold">
          {lista == null ? "Buscando…" : `${lista.length} ${lista.length === 1 ? "profissional" : "profissionais"}${nomeCategoria ? ` de ${nomeCategoria.toLowerCase()}` : ""}`}
        </h2>
        {lista?.length === 0 && (
          <p className="cartao text-sm text-suave">
            Nenhum profissional atende essa região ainda. Faça um pedido mesmo assim: avisaremos os profissionais da categoria.
          </p>
        )}
        <ul className="space-y-3">
          {(lista ?? []).map((p) => (
            <li key={p.id}>
              <Link href={`/profissional/${p.id}`} className="cartao flex items-center gap-3 transition hover:border-marca">
                <Avatar nome={p.nome} foto={p.foto_url} tamanho={56} />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate font-semibold">{p.nome}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {p.verificado && <SeloVerificado />}
                    <Nota nota={Number(p.nota_media)} total={p.total_avaliacoes} />
                  </div>
                  <p className="flex items-center gap-1 text-xs text-suave">
                    <MapPin className="h-3.5 w-3.5" aria-hidden /> {p.bairro ?? "Teresina"} · {formatarDistancia(Number(p.distancia_km))} ·{" "}
                    {p.total_servicos} serviços
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Link href={`/pedido/novo${categoria ? `?categoria=${categoria}` : ""}`} className="btn-acao w-full">
        Pedir orçamento{nomeCategoria ? ` de ${nomeCategoria.toLowerCase()}` : ""}
      </Link>
    </div>
  );
}
