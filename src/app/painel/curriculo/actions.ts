"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/erros";
import { motivoContato } from "@/lib/contato";
import { CATEGORIAS } from "@/lib/categorias";
import type { Resultado } from "@/lib/tipos";

async function profissionalLogado() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, uid: null };
  const { data } = await supabase.from("perfis").select("tipo").eq("id", user.id).single();
  return { supabase, uid: data?.tipo === "profissional" ? user.id : null };
}

export async function salvarCurriculo(_: unknown, form: FormData): Promise<Resultado> {
  const descricao = String(form.get("descricao") ?? "").trim().slice(0, 1000);
  const cursos = form.getAll("cursos").map((c) => String(c).trim()).filter(Boolean).slice(0, 10);
  const ativas = new Set(CATEGORIAS.filter((c) => c.ativa).map((c) => c.slug));
  const especialidades = form.getAll("especialidades").map(String).filter((s) => ativas.has(s));

  if (descricao.length < 20) return { ok: false, erro: "Escreva uma descrição com pelo menos 20 caracteres." };
  if (especialidades.length === 0) return { ok: false, erro: "Marque pelo menos uma especialidade." };
  const bloqueado = [descricao, ...cursos].map(motivoContato).find(Boolean);
  if (bloqueado) return { ok: false, erro: `Encontramos ${bloqueado} no texto. ${traduzirErro("CONTATO_BLOQUEADO")}` };

  const { supabase, uid } = await profissionalLogado();
  if (!uid) return { ok: false, erro: "Apenas profissionais podem editar o currículo." };

  const { error } = await supabase.from("profissionais").update({ descricao, cursos }).eq("id", uid);
  if (error) return { ok: false, erro: traduzirErro(error.message) };

  const { data: atuais } = await supabase.from("profissional_categorias").select("categoria_slug").eq("profissional_id", uid);
  const tinha = new Set((atuais ?? []).map((a) => a.categoria_slug as string));
  const remover = [...tinha].filter((s) => !especialidades.includes(s));
  const adicionar = especialidades.filter((s) => !tinha.has(s));
  if (remover.length) {
    const { error: e } = await supabase.from("profissional_categorias").delete().eq("profissional_id", uid).in("categoria_slug", remover);
    if (e) return { ok: false, erro: traduzirErro(e.message) };
  }
  if (adicionar.length) {
    const { error: e } = await supabase
      .from("profissional_categorias")
      .insert(adicionar.map((categoria_slug) => ({ profissional_id: uid, categoria_slug })));
    if (e) return { ok: false, erro: traduzirErro(e.message) };
  }

  revalidatePath("/painel", "layout");
  revalidatePath(`/profissional/${uid}`);
  return { ok: true };
}

export async function adicionarFotoTrabalho(caminho: string, legenda: string): Promise<Resultado> {
  if (motivoContato(legenda)) return { ok: false, erro: traduzirErro("CONTATO_BLOQUEADO") };
  const { supabase, uid } = await profissionalLogado();
  if (!uid) return { ok: false, erro: "Apenas profissionais podem adicionar fotos." };
  const { error } = await supabase.from("portfolio_fotos").insert({ profissional_id: uid, caminho, legenda: legenda.slice(0, 120) });
  if (error) {
    await supabase.storage.from("publico").remove([caminho]);
    return { ok: false, erro: traduzirErro(error.message) };
  }
  revalidatePath("/painel/curriculo");
  revalidatePath(`/profissional/${uid}`);
  return { ok: true };
}

export async function removerFotoTrabalho(id: string): Promise<Resultado> {
  const { supabase, uid } = await profissionalLogado();
  if (!uid) return { ok: false, erro: "Sem permissão." };
  const { data } = await supabase.from("portfolio_fotos").select("caminho").eq("id", id).eq("profissional_id", uid).single();
  if (!data) return { ok: false, erro: "Foto não encontrada." };
  const { error } = await supabase.from("portfolio_fotos").delete().eq("id", id);
  if (error) return { ok: false, erro: traduzirErro(error.message) };
  if (!data.caminho.startsWith("/")) await supabase.storage.from("publico").remove([data.caminho]);
  revalidatePath("/painel/curriculo");
  revalidatePath(`/profissional/${uid}`);
  return { ok: true };
}
