"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/erros";
import { motivoContato } from "@/lib/contato";
import type { Resultado } from "@/lib/tipos";

const soDigitos = (v: FormDataEntryValue | null) => String(v ?? "").replace(/\D/g, "");

export async function salvarConta(_: unknown, form: FormData): Promise<Resultado> {
  const nome = String(form.get("nome") ?? "").trim();
  const bairro = String(form.get("bairro") ?? "").trim();
  const telefone = soDigitos(form.get("telefone"));
  const whatsapp = soDigitos(form.get("whatsapp"));

  if (nome.length < 2) return { ok: false, erro: "Digite seu nome." };
  if (motivoContato(nome) || motivoContato(bairro)) return { ok: false, erro: traduzirErro("CONTATO_BLOQUEADO") };
  for (const [rotulo, v] of [["Telefone", telefone], ["WhatsApp", whatsapp]] as const) {
    if (v && !/^\d{10,11}$/.test(v)) return { ok: false, erro: `${rotulo}: digite DDD + número (ex.: 86 99999-1234).` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Faça login novamente." };

  const { error: e1 } = await supabase.from("perfis").update({ nome, bairro }).eq("id", user.id);
  if (e1) return { ok: false, erro: traduzirErro(e1.message) };
  const { error: e2 } = await supabase
    .from("contatos_privados")
    .upsert({ id: user.id, telefone: telefone || null, whatsapp: whatsapp || null });
  if (e2) return { ok: false, erro: traduzirErro(e2.message) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function salvarFotoPerfil(caminho: string): Promise<Resultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !caminho.startsWith(`${user.id}/`)) return { ok: false, erro: "Foto inválida." };
  const { error } = await supabase.from("perfis").update({ foto_url: caminho }).eq("id", user.id);
  if (error) return { ok: false, erro: traduzirErro(error.message) };
  revalidatePath("/", "layout");
  return { ok: true };
}
