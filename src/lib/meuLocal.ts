import { createClient } from "./supabase/server";
import { CENTRO_TERESINA } from "./geo";
import { perfilAtual } from "./perfil";

export type MeuLocal = { lat: number; lng: number; fonte: "gps" | "bairro" | "cidade" };

/** Localização aproximada do usuário logado (GPS salvo > bairro > centro da cidade) */
export async function meuLocal(): Promise<MeuLocal> {
  const { usuario } = await perfilAtual();
  if (!usuario) return { ...CENTRO_TERESINA, fonte: "cidade" };
  const supabase = await createClient();
  const { data } = await supabase.rpc("meu_local").maybeSingle<MeuLocal>();
  return data?.lat != null ? data : { ...CENTRO_TERESINA, fonte: "cidade" };
}
