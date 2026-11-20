import { cache } from "react";
import { createClient } from "./supabase/server";
import { supabaseConfigurado } from "./supabase/config";
import type { Perfil } from "./tipos";

/** Usuário logado + perfil dele (consulta uma vez só por página) */
export const perfilAtual = cache(async () => {
  if (!supabaseConfigurado) return { usuario: null, perfil: null };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { usuario: null, perfil: null };
  const { data } = await supabase
    .from("perfis")
    .select("id, tipo, nome, foto_url, bairro, aceitou_termos_em, versao_termos, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return { usuario: user, perfil: (data as Perfil | null) ?? null };
});

export function primeiroNome(nome: string | null | undefined) {
  return (nome ?? "").trim().split(/\s+/)[0] || "Usuário";
}
