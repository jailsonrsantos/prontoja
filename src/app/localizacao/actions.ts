"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/erros";
import type { Resultado } from "@/lib/tipos";

/** Salva a localização APROXIMADA do usuário (o banco arredonda de novo para ~1 km) */
export async function salvarMinhaLocalizacao(lat: number, lng: number): Promise<Resultado> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { ok: false, erro: "Localização inválida." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: true }; // visitante: usa só no aparelho, sem salvar
  const { error } = await supabase.from("localizacoes").upsert({ usuario_id: user.id, lat, lng });
  if (error) return { ok: false, erro: traduzirErro(error.message) };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Apaga a localização salva: o app volta a usar o centro do bairro */
export async function apagarMinhaLocalizacao(): Promise<Resultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: true };
  const { error } = await supabase.from("localizacoes").delete().eq("usuario_id", user.id);
  if (error) return { ok: false, erro: traduzirErro(error.message) };
  revalidatePath("/", "layout");
  return { ok: true };
}
