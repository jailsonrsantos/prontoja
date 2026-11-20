/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, MapPin, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { urlPublica } from "@/lib/storage";
import { buscarCategoria } from "@/lib/categorias";
import { Avatar } from "@/components/Avatar";
import { Nota, SeloVerificado } from "@/components/Selos";
import { IconeCategoria } from "@/components/IconeCategoria";

type Dados = {
  id: string;
  descricao: string;
  cursos: string[];
  verificado: boolean;
  nota_media: number;
  total_avaliacoes: number;
  total_servicos: number;
  perfis: { nome: string; foto_url: string | null; bairro: string | null } | null;
  profissional_categorias: { categoria_slug: string }[];
  portfolio_fotos: { id: string; caminho: string; legenda: string }[];
};

async function carregar(id: string): Promise<Dados | null> {
  if (!supabaseConfigurado || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profissionais")
    .select(
      "id, descricao, cursos, verificado, nota_media, total_avaliacoes, total_servicos, perfis(nome, foto_url, bairro), profissional_categorias(categoria_slug), portfolio_fotos(id, caminho, legenda)",
    )
    .eq("id", id)
    .maybeSingle();
  return data as unknown as Dados | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = await carregar((await params).id);
  return { title: p?.perfis?.nome ?? "Profissional" };
}

export default async function PaginaProfissional({ params }: { params: Promise<{ id: string }> }) {
  const p = await carregar((await params).id);
  if (!p || !p.perfis) notFound();
  const nome = p.perfis.nome || "Profissional";

  return (
    <article className="space-y-4">
      <header className="cartao flex items-center gap-4">
        <Avatar nome={nome} foto={p.perfis.foto_url} tamanho={80} />
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-bold leading-tight">{nome}</h1>
          {p.verificado && <SeloVerificado />}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Nota nota={Number(p.nota_media)} total={p.total_avaliacoes} />
            <span className="text-sm text-suave">
              {p.total_servicos} {p.total_servicos === 1 ? "serviço" : "serviços"}
            </span>
          </div>
          {p.perfis.bairro && (
            <p className="flex items-center gap-1 text-sm text-suave">
              <MapPin className="h-4 w-4" aria-hidden /> {p.perfis.bairro}, Teresina
            </p>
          )}
        </div>
      </header>

      {p.profissional_categorias.length > 0 && (
        <section className="cartao space-y-2">
          <h2 className="flex items-center gap-2 font-bold"><Wrench className="h-5 w-5 text-marca" aria-hidden /> Especialidades</h2>
          <ul className="flex flex-wrap gap-2">
            {p.profissional_categorias.map(({ categoria_slug }) => (
              <li key={categoria_slug} className="inline-flex items-center gap-1 rounded-full bg-marca-clara px-3 py-1 text-sm font-medium text-marca">
                <IconeCategoria slug={categoria_slug} className="h-4 w-4" />
                {buscarCategoria(categoria_slug)?.nome ?? categoria_slug}
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.descricao && (
        <section className="cartao space-y-2">
          <h2 className="font-bold">Sobre</h2>
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{p.descricao}</p>
        </section>
      )}

      {p.cursos.length > 0 && (
        <section className="cartao space-y-2">
          <h2 className="flex items-center gap-2 font-bold"><Award className="h-5 w-5 text-marca" aria-hidden /> Cursos e certificados</h2>
          <ul className="list-disc space-y-1 pl-5 text-[15px]">
            {p.cursos.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </section>
      )}

      {p.portfolio_fotos.length > 0 && (
        <section className="cartao space-y-2">
          <h2 className="font-bold">Fotos de trabalhos</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {p.portfolio_fotos.map((f) => (
              <li key={f.id}>
                <figure>
                  <img src={urlPublica(f.caminho) ?? ""} alt={f.legenda || "Foto de trabalho"} className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
                  {f.legenda && <figcaption className="mt-1 text-xs text-suave">{f.legenda}</figcaption>}
                </figure>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="cartao space-y-2">
        <h2 className="font-bold">Avaliações</h2>
        <p className="text-sm text-suave">
          {p.total_avaliacoes
            ? "As avaliações detalhadas aparecem aqui a partir da Etapa 5."
            : "Este profissional ainda não recebeu avaliações."}
        </p>
      </section>
    </article>
  );
}
