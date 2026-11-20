import { SUPABASE_URL } from "./supabase/config";

export const BUCKET_PUBLICO = "publico";

/** Converte o caminho salvo no banco em um endereço de imagem */
export function urlPublica(caminho: string | null | undefined): string | null {
  if (!caminho) return null;
  if (caminho.startsWith("/") || caminho.startsWith("http")) return caminho;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_PUBLICO}/${caminho}`;
}
