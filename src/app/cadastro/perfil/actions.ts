"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { caminhoSeguro, traduzirErro } from "@/lib/erros";
import { VERSAO_TERMOS } from "@/lib/termos";
import { motivoContato } from "@/lib/contato";
import type { TipoUsuario } from "@/lib/tipos";

export async function concluirCadastro(_: unknown, form: FormData): Promise<{ erro: string } | void> {
  const tipo = form.get("tipo") as TipoUsuario | null;
  const nome = String(form.get("nome") ?? "").trim();
  const bairro = String(form.get("bairro") ?? "").trim();
  const aceitou = form.get("aceitou") === "on";
  const voltar = caminhoSeguro(String(form.get("voltar") ?? ""));

  if (tipo !== "cliente" && tipo !== "profissional") return { erro: "Escolha se você quer contratar ou trabalhar." };
  if (nome.length < 2) return { erro: "Digite seu nome." };
  if (!bairro) return { erro: "Informe seu bairro." };
  if (motivoContato(nome) || motivoContato(bairro)) return { erro: traduzirErro("CONTATO_BLOQUEADO") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: atual } = await supabase.from("perfis").select("tipo, aceitou_termos_em").eq("id", user.id).single();
  if (!atual?.aceitou_termos_em && !aceitou) {
    return { erro: "Para continuar, aceite os Termos de Uso e a Política de Privacidade." };
  }

  const dados: Record<string, unknown> = { nome, bairro };
  if (!atual?.tipo) dados.tipo = tipo;
  if (!atual?.aceitou_termos_em) {
    dados.aceitou_termos_em = new Date().toISOString(); // o banco troca pela hora do servidor
    dados.versao_termos = VERSAO_TERMOS;
  }
  const { error } = await supabase.from("perfis").update(dados).eq("id", user.id);
  if (error) return { erro: traduzirErro(error.message) };

  const tipoFinal = atual?.tipo ?? tipo;
  redirect(tipoFinal === "profissional" && voltar === "/" ? "/painel/curriculo?novo=1" : voltar);
}
