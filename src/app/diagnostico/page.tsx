import type { Metadata } from "next";
import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL, supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Diagnóstico", robots: { index: false } };
export const dynamic = "force-dynamic";

type Item = { nome: string; estado: "ok" | "erro" | "aviso"; detalhe: string; solucao?: string };

const faltaTabela = (msg?: string) => Boolean(msg && /does not exist|schema cache|could not find/i.test(msg));

async function verificar(): Promise<Item[]> {
  const itens: Item[] = [];
  if (!supabaseConfigurado) {
    return [{
      nome: "Chaves do Supabase na Vercel",
      estado: "erro",
      detalhe: "NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não estão configuradas.",
      solucao: "Vercel → seu projeto → Settings → Environment Variables: adicione as duas e depois Deployments → ⋯ → Redeploy.",
    }];
  }
  let dominio = "";
  try { dominio = new URL(SUPABASE_URL).host; } catch { /* inválida */ }
  itens.push({
    nome: "Chaves do Supabase na Vercel",
    estado: dominio.endsWith(".supabase.co") ? "ok" : "aviso",
    detalhe: dominio ? `Conectando em ${dominio}` : "A URL do Supabase parece inválida.",
    solucao: dominio.endsWith(".supabase.co") ? undefined : "Confira o Project URL (Supabase → Project Settings → Data API).",
  });

  const supabase = await createClient();

  const cat = await supabase.from("categorias").select("slug", { count: "exact", head: true });
  if (cat.error) {
    const tabela = faltaTabela(cat.error.message);
    itens.push({
      nome: "Banco da Etapa 2 (migração 001)",
      estado: "erro",
      detalhe: tabela ? "As tabelas de cadastro não existem no Supabase." : `Erro ao conectar: ${cat.error.message}`,
      solucao: tabela
        ? "Supabase → SQL Editor → New query → cole supabase/migrations/001_etapa2_perfis.sql → Run."
        : "Confira se a chave anon/publishable está correta e se o projeto do Supabase não está pausado.",
    });
    return itens;
  }
  itens.push({ nome: "Banco da Etapa 2 (migração 001)", estado: "ok", detalhe: `${cat.count} categorias encontradas.` });

  const bairros = await supabase.from("bairros").select("nome", { count: "exact", head: true });
  itens.push(
    bairros.error
      ? { nome: "Banco da Etapa 3 (migração 002)", estado: "erro", detalhe: "Tabelas de pedidos/mapa não existem.", solucao: "SQL Editor → rode supabase/migrations/002_etapa3_pedidos_mapa.sql." }
      : { nome: "Banco da Etapa 3 (migração 002)", estado: "ok", detalhe: `${bairros.count} bairros com localização.` },
  );

  if (!bairros.error) {
    const pros = await supabase.rpc("buscar_profissionais_proximos", { p_lat: null, p_lng: null, p_categoria: null });
    const n = Array.isArray(pros.data) ? pros.data.length : 0;
    itens.push(
      pros.error
        ? { nome: "Busca por proximidade", estado: "erro", detalhe: pros.error.message, solucao: "Rode de novo a migração 002." }
        : { nome: "Dados de exemplo", estado: n ? "ok" : "aviso", detalhe: `${n} profissionais encontrados no mapa.`, solucao: n ? undefined : "SQL Editor → rode supabase/seed_exemplo.sql." },
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    itens.push({ nome: "Login", estado: "aviso", detalhe: "Você não está logado. Entre e abra esta página de novo para checar seu cadastro." });
    return itens;
  }
  itens.push({ nome: "Login", estado: "ok", detalhe: `Logado como ${user.email} (${user.app_metadata?.provider === "google" ? "Google" : "e-mail"}).` });

  const perfil = await supabase.from("perfis").select("tipo, nome, bairro, aceitou_termos_em").eq("id", user.id).maybeSingle();
  if (perfil.error || !perfil.data) {
    itens.push({
      nome: "Seu perfil",
      estado: "erro",
      detalhe: perfil.error ? perfil.error.message : "Sua conta não tem perfil no banco.",
      solucao: "Rode de novo a migração 001 (ela cria perfis para contas antigas).",
    });
  } else {
    const p = perfil.data;
    const completo = p.tipo && p.aceitou_termos_em;
    itens.push({
      nome: "Seu perfil",
      estado: completo ? "ok" : "aviso",
      detalhe: `Tipo: ${p.tipo ?? "não escolhido"} · Termos: ${p.aceitou_termos_em ? "aceitos" : "não aceitos"} · Bairro: ${p.bairro ?? "—"}`,
      solucao: completo ? undefined : "Abra /cadastro/perfil e conclua. Se der erro lá, mande print da mensagem.",
    });
  }

  const pub = await supabase.storage.from("publico").list(user.id, { limit: 1 });
  itens.push(
    pub.error
      ? { nome: "Armazenamento de fotos", estado: "erro", detalhe: pub.error.message, solucao: "Rode de novo a migração 001 (ela cria o espaço de fotos 'publico')." }
      : { nome: "Armazenamento de fotos", estado: "ok", detalhe: "Espaço de fotos acessível." },
  );
  return itens;
}

const ICONE = {
  ok: <CheckCircle2 className="h-6 w-6 shrink-0 text-protegido" aria-label="OK" />,
  aviso: <CircleAlert className="h-6 w-6 shrink-0 text-amber-600" aria-label="Atenção" />,
  erro: <XCircle className="h-6 w-6 shrink-0 text-red-600" aria-label="Erro" />,
};

export default async function Diagnostico() {
  const itens = await verificar();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-marca">Diagnóstico do app</h1>
      <p className="text-sm text-suave">Esta página verifica a configuração. Tire um print e envie se algo estiver vermelho.</p>
      <ul className="space-y-3">
        {itens.map((i) => (
          <li key={i.nome} className="cartao flex gap-3">
            {ICONE[i.estado]}
            <div className="min-w-0 space-y-1">
              <p className="font-semibold">{i.nome}</p>
              <p className="break-words text-sm text-suave">{i.detalhe}</p>
              {i.solucao && <p className="text-sm font-medium text-texto">👉 {i.solucao}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
